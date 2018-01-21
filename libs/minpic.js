'use strict'

let crypto = require('crypto')
let fs = require('fs')
let path = require('path')
let cwd = process.cwd()
let glob = require('glob')
let tinify = require('tinify')
let ProgressBar = require('progress')
let exec = require('child_process').exec
let arr = []
let bar
let json = {}
//拿到所有图片
let list = glob.sync(cwd + '/src/**/*.@(jpg|png|jpeg)')
list.forEach(function(item, index) {
  list[index] = {
    path: item
  }
})
//拿到压缩信息
fs.appendFileSync(path.resolve(cwd, 'minpic.txt'), '')
let ob = fs.readFileSync(path.resolve(cwd, 'minpic.txt'), 'utf-8').split('\n')

try {
  json = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'minpic.json'), 'utf-8')
  )
  tinify.key = json.key || json.keylist[0]
} catch (e) {
  console.log('缺少 minpic.json 文件或文件内容不正确，请联系 shaopeng1')
  return
}

//判断key
function changeKey() {
  //防止用户添加tinypng key重复
  let nextIndex = json.keylist.indexOf(json.key) + 1
  changeKeyNumber++
  if (json.keylist.length <= nextIndex) {
    nextIndex = 0
  }
  if (changeKeyNumber == json.keylist.length) {
    console.log('需要新增key')
    return false
  }
  json.key = json.keylist[nextIndex]
  tinify.key = json.key
  fs.writeFileSync(FILENAME, JSON.stringify(json, null, 4))
  return true
}

function zip(item) {
  let image = tinify.fromFile(item.path)
  image.toFile(item.path, rs => {
    if (rs && /limit/.test(rs.message)) {
      // if (changeKey()) {
      //  zip(item);
      // };
      console.log(rs)
    } else if (!rs) {
      bar.tick()
      async function fn() {
        return await new Promise(function(resolve) {
          let hash = crypto.createHash('md5')
          let rs = fs.createReadStream(item.path)
          rs.on('data', hash.update.bind(hash))
          rs.on('end', function() {
            let hashs = hash.digest('hex')
            resolve(hashs)
          })
        })
      }
      fn().then(function(val) {
        fs.appendFileSync(path.resolve(cwd, 'minpic.txt'), '\n' + val)
        fs.stat(
          path.resolve(cwd, 'dist/static/img/' + path.parse(item.path).base),
          function(err, docs) {
            if (!err) {
              exec(
                'cp ' +
                  item.path +
                  ' ' +
                  path.resolve(
                    cwd,
                    'dist/static/img/' + path.parse(item.path).base
                  )
              )
            }
          }
        )
      })
    }
  })
}

async function fn() {
  for (let i = 0; i < list.length; i++) {
    arr.push(
      await new Promise(function(resolve) {
        let hash = crypto.createHash('md5')
        let rs = fs.createReadStream(list[i].path)
        rs.on('data', hash.update.bind(hash))
        rs.on('end', function() {
          let hashs = hash.digest('hex')
          list[i].hash = hashs
          if (ob.includes(hashs)) {
            //不需要压缩
            list[i].min = false
            resolve(hashs)
          } else {
            //需要压缩
            list[i].min = true
            resolve(hashs)
          }
        })
      })
    )
  }
  return arr
}

fn().then(function(val) {
  bar = new ProgressBar(':bar', {
    total: list.length,
    width: 100
  })
  list.forEach(function(item) {
    if (!item.min) {
      bar.tick()
      return
    }
    zip(item)
  })
})
