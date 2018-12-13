'use strict'

const ora = require('ora')
const axios = require('axios')
const chalk = require('chalk')
const execa = require('execa')

const GITLAB_HOST = 'https://gitlab.weibo.cn'
const fetch = axios.create({
  baseURL: `${GITLAB_HOST}/api/v4/`
})

// 内部调试用
// 当为 true 时，发布到 ci dev 环境
// marauder 发布时，请确保关闭
const DEBUG = false

function replayAsync(fn, assertFn, maxLoop = 10, wait = 1000) {
  return (...args) => {
    let cycles = 0

    return new Promise(async function tillTheWorldEnds(resolve, reject) {
      let res = null
      let isEndTime = false

      try {
        res = await fn.apply(fn, args)
        isEndTime = assertFn(res) || ++cycles > maxLoop
      } catch (e) {
        return reject(e)
      }

      return isEndTime
        ? resolve(res)
        : setTimeout(tillTheWorldEnds, wait, resolve)
    })
  }
}

async function doCIJob(repoName, tagName) {
  const pid = encodeURIComponent(repoName)
  const spinner = ora(`Searching job...`).start()
  let job = null

  try {
    // job 创建需要时间，因此循环请求
    job = await replayAsync(getTestJob, data => data)(pid, tagName)
  } catch (e) {
    // fetch error
    if (e.response) {
      spinner.fail('Searching job: ' + e.response.data.error + '\n')
      console.log(chalk.red(e.response.data.error_description), '\n')
    } else {
      spinner.fail('Searching job\n')
      console.log(chalk.red(e), '\n')
    }

    throw new Error(e)
  }

  if (!job) {
    spinner.fail('未匹配到 CI 任务，请更新 gitlab-ci.yml\n')

    console.log(
      chalk.yellow(
        'https://raw.githubusercontent.com/SinaMFE/marauder-template/master/.gitlab-ci.yml'
      ),
      '\n'
    )

    throw new Error()
  }

  spinner.text = `Running job #${job.id}...`

  try {
    const assertReady = data => data.status != 'created'

    // job 就绪需要时间，因此循环请求
    job = await replayAsync(getJobInfo, assertReady, 10, 1500)(pid, job.id)

    // return job
    return await playJob(pid, job.id, spinner)
  } catch (e) {
    // fetch error
    if (e.response) {
      spinner.fail('Running job: ' + e.response.data.error + '\n')
      console.log(chalk.red(e.response.data.error_description), '\n')
    } else {
      spinner.fail('Running job\n')
      console.log(chalk.red(e), '\n')
    }

    throw new Error(e)
  }
}

async function getJobInfo(pid, jobId) {
  const rep = await fetch.get(`/projects/${pid}/jobs/${jobId}`)

  return rep.data
}

async function getTestJob(pid, tagName) {
  const { data: jobs } = await fetch.get(`/projects/${pid}/jobs`)

  return jobs.find(job => {
    const isTargetTag = job.ref == tagName
    const isTestJob = job.stage == (DEBUG ? 'dev' : 'test')
    const isSimulate = job.name == (DEBUG ? 'dev' : 'simulate')

    return isTargetTag && isTestJob && isSimulate
  })
}

async function playJob(pid, jobId, spinner) {
  // replay 操作将会创建新 job
  // 为了更具拓展，这里统一使用新 job
  const { data: job } = await fetch.post(`/projects/${pid}/jobs/${jobId}/play`)

  // https://docs.gitlab.com/ee/ci/pipelines.html#ordering-of-jobs-in-pipeline-graphs
  let status = job.status
  let traceBuffer = ''

  while (status == 'pending' || status == 'running') {
    const { status: runningStatus } = await getJobInfo(pid, job.id)
    const { data: trace } = await fetch.get(
      `/projects/${pid}/jobs/${job.id}/trace`
    )
    const output = trace.replace(traceBuffer, '')

    status = runningStatus

    if (!output) continue

    if (!traceBuffer && trace) spinner.stop()

    traceBuffer = trace
    console.log(output)
  }

  spinner.stop()

  return job
}

function getPushErrTip(error) {
  const msg = ['\n😲  操作已回滚']

  if (error.includes('connect to host')) {
    msg.push('请检查您的网络连接')
  } else if (error.includes('git pull')) {
    msg.push('检测到远程分支更新，请先执行 git pull 操作')
  }

  return chalk.yellow(msg.join('，'))
}

function checkRepo(remote, branch) {
  if (!remote) throw new Error('请设置远程仓库')

  if (remote.indexOf('http') > -1) throw new Error('请配置 ssh 仓库地址')

  if (!DEBUG && branch != 'master')
    throw new Error(chalk.red('🚧  请在 master 分支上执行 test 发布操作'))
}

async function pushBuildCommit(branchName, verInfo) {
  const spinner = ora('Add commit...').start()
  const commitInfo = await addCommit(verInfo)

  spinner.text = 'Pushing commits...'

  try {
    // push commit
    await execa('git', ['push', 'origin', branchName])
  } catch (e) {
    // 回滚 commit
    await execa('git', ['reset', 'HEAD~'])
    spinner.stop()

    throw new Error(e.stderr + getPushErrTip(e.stderr))
  }

  spinner.succeed(commitInfo + '\n')
}

async function pushBuildTag(tagName, tagMsg, repoUrl) {
  const spinner = ora('Add tag...').start()
  await execa('git', ['tag', '-a', tagName, '-m', tagMsg])

  spinner.text = `Pushing tag #${tagName}...`

  try {
    await execa('git', ['push', 'origin', tagName])
  } catch (e) {
    // 回滚 tag
    await execa('git', ['tag', '-d', tagName])
    spinner.stop()

    const tip = ['\n😲  操作已回滚，请手动发布:', `${repoUrl}/tags/new`].join(
      '\n'
    )

    throw new Error(e.stderr + chalk.yellow(tip))
  }

  spinner.stop()
}

async function addCommit(verInfo) {
  await execa('git', ['add', '.'])

  const { stdout: commitInfo } = await execa('git', [
    'commit',
    '-m',
    `[TEST] v${verInfo}`
  ])

  return commitInfo
}

async function showManualTip(repoUrl, type = 'token') {
  const { stdout: lastCommit } = await execa('git', ['rev-parse', 'HEAD'])
  const commitPage = chalk.yellow(`${repoUrl}/commit/${lastCommit}`)

  if (type == 'token') {
    console.log(chalk.red('未配置 CI 访问权限，请手动发布:'))
    console.log(commitPage, '\n')

    console.log(
      '推荐在 marauder.config.ciConfig 中配置 privateToken 以启用自动化发布\n'
    )
    console.log('Private Token 生成链接：')
    console.log(chalk.yellow(`${GITLAB_HOST}/profile/personal_access_tokens`))
  } else if (type == 'ci') {
    console.log(chalk.red('任务失败，请手动发布:'))
    console.log(commitPage, '\n')
  }
}

module.exports = async function hybridTestPublish(entry, testMsg) {
  const path = require('path')
  const config = require('../../config')
  const { URL } = require('url')
  const { version } = require(config.paths.packageJson)

  const tagPrefix = `tag__${entry}__`
  const verInfo = `${version}-${Date.now()}`
  const tagName = tagPrefix + verInfo
  const tagMsg = testMsg || `test ${entry} v${verInfo}`

  console.log('----------- Test Publish -----------\n')

  const { stdout: branchName } = await execa('git', [
    'symbolic-ref',
    '--short',
    'HEAD'
  ])
  const { stdout: remoteUrl } = await execa('git', [
    'config',
    '--get',
    'remote.origin.url'
  ])

  checkRepo(remoteUrl, branchName)

  const baseRepoName = path.basename(remoteUrl, '.git')
  // /SINA_MFE/snhy
  const fullRepoName = new URL(remoteUrl).pathname
    .replace(/\.git/, '')
    .replace('/', '')
  const repoUrl = GITLAB_HOST + '/' + fullRepoName

  await pushBuildCommit(branchName, verInfo)

  await pushBuildTag(tagName, tagMsg, repoUrl)

  console.log(chalk.yellow('Tag: ' + tagName))
  console.log(chalk.yellow('Msg: ' + tagMsg), '\n')

  if (!config.ciConfig || !config.ciConfig.privateToken) {
    return await showManualTip(repoUrl, 'token')
  }

  fetch.defaults.headers.common['Private-Token'] = config.ciConfig.privateToken
  console.log('-------------- CI job --------------\n')

  try {
    const job = await doCIJob(fullRepoName, tagName)

    console.log(chalk.bgGreen(' DONE '), `${repoUrl}/-/jobs/${job.id}`)
  } catch (e) {
    const { stdout: lastCommit } = await execa('git', ['rev-parse', 'HEAD'])

    DEBUG && console.log(e)
    await showManualTip(repoUrl, 'ci')
  }
}
