const EXPECTED_ACTIVITIES = 4
const MAX_POINTS = 3
const WAIT_TIMEOUT = 60000
const GOTO_TIMEOUT = 60000
const EXECUTION_TIMEOUT = 60000
const PWD_FILE = 'pwd.in'

const sections = {
  '157324': 'A',
  '157325': 'B',
  '157326': 'C',
  '157332': 'D',
  '157335': 'E',
  '157418': 'F',
}

const csvHeader = [
  //'Last Name',
  //'First Name',
  //'Username',
  //'Student ID',
  //'Last Access',
  //'Availability',
  //'section [Total Pts: 0 Text]',
  //'Group [Total Pts: 0 Text]',
  //'Week 1 Recitation [Total Pts: 3 Score]',
  'Week 2 Recitation - 8 Hours without the internet [Total Pts: 3 Score]',
  'Social Media Unit - Recitation Session 1 [Total Pts: 3 Score]',
  'Social Media Unit - Recitation Session 2 [Total Pts: 3 Score]',
  'Signals Unit - Recitation Session 1 [Total Pts: 3 Score]',
  'Signals Unit - Recitation Session 2 [Total Pts: 3 Score]',
  'Embedded Systems Unit - Recitation Session 1 [Total Pts: 3 Score]',
  'Embedded Systems Unit - Recitation Session 2 [Total Pts: 3 Score]',
  //'Web Design Assignment [Total Pts: 3 Score]',
  'Web Design Unit - Recitation Session 1 [Total Pts: 3 Score]',
  'Web Design Unit - Recitation Session 2 [Total Pts: 3 Score]',
  'Infrastructure Unit - Recitation Session 1 [Total Pts: 3 Score]',
  'Infrastructure Unit - Recitation Session 2 [Total Pts: 3 Score]',
  'Compression Unit - Recitation Session 1 [Total Pts: 3 Score]',
  'Compression Unit - Recitation Session 2 [Total Pts: 3 Score]',
]

//exports.result = []

function cleanup(row) {
  var newRow = {}
  for (var key in row) {
    csvHeader.forEach((curVal) => {
      if (key.includes(curVal) && row[key] != '') {
        newRow[curVal] = row[key]
      }
    })
  }
  return newRow
}

function processRow(row) {
  for (var key in row) {
    if (key.includes('Username')) var username = row[key]
    if (key.includes('Last Name')) var lastname = row[key]
    if (key.includes('First Name')) var firstname = row[key]
    if (key.includes('section')) var section = row[key] 
  }
  var newRow = cleanup(row)
  var cnt = 0
  var keyCnt = 0
  for (var key in newRow) {
    keyCnt++
    score = parseInt(newRow[key])
    if (score < MAX_POINTS) {
      cnt++
    }
  }
  if (keyCnt < EXPECTED_ACTIVITIES) {
    cnt = cnt + EXPECTED_ACTIVITIES - keyCnt
  }
  if (cnt > 2) {
    //console.log(section + ', ' + firstname + ' ' + lastname + ', ' + username)
    //exports.result.push([section, firstname + ' ' + lastname, username])
    console.log(firstname + ' ' + lastname + ', ' + username)
  }
}
  
function runNightmare(id, section) {
  const Nightmare = require('nightmare')
  require('nightmare-download-manager')(Nightmare)
  const nightmare = Nightmare({
    show: true,
    paths: {
      downloads: process.cwd(),
    },
    waitTimeout: WAIT_TIMEOUT,
    gotoTimeout: GOTO_TIMEOUT,
    executionTimeout: EXECUTION_TIMEOUT,
   })

  nightmare.on('console', (type, msg) => {
    if (type == 'log') console.log(msg)
    else console.error(msg)
  })

  nightmare.on('download', (state, downloadItem) => {
    var csv = process.cwd() + '/' + section + '.csv'
    if(state == 'started') {
      nightmare.emit('download', csv, downloadItem)
    } else if (state == 'completed') {
      const fs = require('fs')
      const csvParser = require('csv-parser')
      fs.createReadStream(csv)
        .pipe(csvParser())
        .on('data', processRow)
        .on('end', () => {
          fs.unlink(csv, (err) => { if (err) throw err })
        })
    }
  })

  const fs = require('fs')
  let input = fs.readFileSync(process.cwd() + '/' + PWD_FILE, { encoding: 'utf8' })
  input = input.split('\n')
  let username = input[0]
  let password = input[1]

  nightmare
    .downloadManager()
    .goto('https://myub.buffalo.edu')
    .wait('input#login')
    .insert('input#login', username)
    .insert('input#password', password)
    .click('input#login-button')
    .wait(4000)
    .goto('https://ublearns.buffalo.edu')
    .wait('#loginBox > a')
    .wait(3000)
    .click('#loginBox > a')
    .wait(3000)
    .goto('https://ublearns.buffalo.edu/webapps/gradebook/do/instructor/downloadGradebook?dispatch=viewDownloadOptions&course_id=_' + id + '_1')
    .wait('#delimiterComma')
    .wait(3000)
    .check('#delimiterComma')
    .wait('#bottom_submitButtonRow > input.submit.button-1')
    .click('#bottom_submitButtonRow > input.submit.button-1')
    .wait('#download_form > a')
    .wait(3000)
    .click('#download_form > a')
    .waitDownloadsComplete()
    .end()
    .then()
    .catch((error) => {
      console.error('Error:' + error)
    })
}

function main() {
  for (var key in sections) {
    runNightmare(key, sections[key])
  }
}

main()
