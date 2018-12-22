const WAIT_TIMEOUT = 60000
const GOTO_TIMEOUT = 60000
const EXECUTION_TIMEOUT = 60000
const PWD_FILE = 'pwd.in'
const FILE_SUFFIX0 = '.0.xls'
const FILE_SUFFIX1 = '.1.xls'

const sections = {
  '449785': 'A',
  '999753': 'B',
  '287174': 'C',
  '096176': 'D',
  '316904': 'E',
  '517380': 'F',
}

async function processFiles(xls0, xls1, section) {
  const xlsReader = require('xlsx')
  var workbookGrade = xlsReader.readFile(xls0)
  var workbookAbsence = xlsReader.readFile(xls1)
  var gradeSheet = workbookGrade.Sheets[workbookGrade.SheetNames[0]]
  var absenceSheet = workbookAbsence.Sheets[workbookAbsence.SheetNames[0]]
  /*
   * gradebook: section, email, firstName, lastName, absences, grade, total
   */
  var gradebook = {}

  /*
   * For grades,
   *
   * column C: email
   * column D: first name
   * column E: last name
   * column G: grade
   * column H: total
   */
  var row = 2 // The first two rows are the header
  var total = gradeSheet['H3'].v
  while (true) {
    row++
    var email = (gradeSheet['C' + row] ? gradeSheet['C' + row].v : undefined)
    var firstName = (gradeSheet['D' + row] ? gradeSheet['D' + row].v : undefined)
    var lastName = (gradeSheet['E' + row] ? gradeSheet['E' + row].v : undefined)
    var grade = (gradeSheet['G' + row] ? gradeSheet['G' + row].v : undefined)

    if (email == undefined) break
    if (grade == undefined) {
      await console.error('No grade for ' + email)
    }
    if (grade[email] === undefined) {
      gradebook[email] = [section, email, firstName, lastName, grade, total]
    } else {
      await console.error('Duplicate entry for ' + email)
    }

  }

  /*
   * For absences,
   *
   * column E: email
   * column K: absences
   */
  row = 1 // The first row is the header
  while (true) {
    row++
    var email = (absenceSheet['E' + row] ? absenceSheet['E' + row].v : undefined)
    var absences = (absenceSheet['K' + row] ? absenceSheet['K' + row].v : undefined)

    if (email == undefined) break
    /*
     * section, email, firstName, lastName, absences, grade, total
     */
    if (gradebook[email] == undefined) {
      console.error('No entry in gradebook for ' + email)
    }
    gradebook[email].splice(4, 0, absences)
  }

  const fs = require('fs')
  fs.unlink(xls0, (err) => { if (err) throw err })
  fs.unlink(xls1, (err) => { if (err) throw err })

  for (var email in gradebook) {
    var data = gradebook[email]
    await console.log(data[0] + ',' + data[1] + ',' + data[2] + ',' + data[3] + ',' + data[4] + ',' + data[5] + ',' + data[6])
  }
}

function getUsernamePassword() {
  const fs = require('fs')
  var input = fs.readFileSync(process.cwd() + '/' + PWD_FILE, { encoding: 'utf8' })
  input = input.split('\n')
  var username = input[0].trim()
  var password = input[1].trim()

  return [username, password]
}
  
async function getGrades(id, section) {
  const returnFilePath = process.cwd() + '/' + section + '.grades.xls'
  const Nightmare = require('nightmare')
  require('nightmare-download-manager')(Nightmare)
  var nightmare = Nightmare({
    show: true,
    paths: {
      downloads: process.cwd(),
    },
    waitTimeout: WAIT_TIMEOUT,
    gotoTimeout: GOTO_TIMEOUT,
    executionTimeout: EXECUTION_TIMEOUT,
    webPreferences: {
      partition: 'nopersist'
    },
  })

  await nightmare.on('console', (type, msg) => {
    if (type == 'log') console.log(msg)
    else console.error(msg)
  })

  await nightmare.on('download', (state, downloadItem) => {
    if (state == 'started') {
      nightmare.emit('download', returnFilePath, downloadItem)
    }
  })

  var usernamePassword = getUsernamePassword()
  var username = usernamePassword[0]
  var password = usernamePassword[1]

  await nightmare
    .downloadManager()
    .goto('https://myub.buffalo.edu')
    .wait('input#login')
    .insert('input#login', username)
    .insert('input#password', password)
    .click('input#login-button')
    .wait(4000)
    .goto('https://app.tophat.com/login')
    .wait('input#login-school-select')
    .wait(2000)
    .type('input#login-school-select', 'University at Buffalo SUNY')
    .wait('.select-input__dropdown-option')
    .wait(2000)
    .click('.select-input__dropdown-option')
    .wait('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-sc-1kvp6pu-2.dBUCOx')
    .wait(2000)
    .click('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-sc-1kvp6pu-2.dBUCOx > button')
    .wait(3000)
    //.goto('https://app.tophat.com/e/' + id + '/gradebook')
    .goto('https://app.tophat.com/e/' + id)
    .wait('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-u91evt-0.hEpkwo > div > nav > ul > li:nth-child(2) > a')
    .wait(2000)
    .click('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-u91evt-0.hEpkwo > div > nav > ul > li:nth-child(2) > a')
    .wait('#region-content > div > div > button.btn.btn-legacy.enter')
    .wait(2000)
    .click('#region-content > div > div > button.btn.btn-legacy.enter')
    .wait('a.student > span:nth-child(2)')
    .wait(2000)
    .click('a.student > span:nth-child(2)')
    .wait('#gradebook-export-dropdown > span.caret')
    .wait(2000)
    .click('#gradebook-export-dropdown > span.caret')
    .wait('#gradebook-beta-app > div.header > div > ul > div.tab-button.dropdown.export-dropdown-button.open > ul > li:nth-child(2) > a > span')
    .wait(2000)
    .click('#gradebook-beta-app > div.header > div > ul > div.tab-button.dropdown.export-dropdown-button.open > ul > li:nth-child(2) > a > span')
    //.wait('#show_attendance')
    //.wait(1000)
    //.check('#show_attendance')
    .wait('#generate')
    .wait(2000)
    .click('#generate')
    .wait('#export_gradebook_body > div > div.task_result > a')
    .wait(2000)
    .click('#export_gradebook_body > div > div.task_result > a')
    .waitDownloadsComplete()
    .end()
    .then()
    .catch((error) => {
      console.error('Nightmare Error:', error)
    })

  return returnFilePath
}

async function getAbsences(id, section) {
  const returnFilePath = process.cwd() + '/' + section + '.absences.xls' 
  const Nightmare = require('nightmare')
  require('nightmare-download-manager')(Nightmare)
  var nightmare = Nightmare({
    show: true,
    paths: {
      downloads: process.cwd(),
    },
    waitTimeout: WAIT_TIMEOUT,
    gotoTimeout: GOTO_TIMEOUT,
    executionTimeout: EXECUTION_TIMEOUT,
    webPreferences: {
      partition: 'nopersist'
    },
  })

  await nightmare.on('console', (type, msg) => {
    if (type == 'log') console.log(msg)
    else console.error(msg)
  })

  await nightmare.on('download', (state, downloadItem) => {
    if (state == 'started') {
      nightmare.emit('download', returnFilePath, downloadItem)
    }
  })

  var usernamePassword = getUsernamePassword()
  var username = usernamePassword[0]
  var password = usernamePassword[1]

  await nightmare
    .downloadManager()
    .goto('https://myub.buffalo.edu')
    .wait('input#login')
    .insert('input#login', username)
    .insert('input#password', password)
    .click('input#login-button')
    .wait(4000)
    .goto('https://app.tophat.com/login')
    .wait('input#login-school-select')
    .wait(2000)
    .type('input#login-school-select', 'University at Buffalo SUNY')
    .wait('.select-input__dropdown-option')
    .wait(2000)
    .click('.select-input__dropdown-option')
    .wait(2000)
    .click('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-sc-1kvp6pu-2.dBUCOx > button')
    .wait(3000)
    //.goto('https://app.tophat.com/e/' + id + '/gradebook')
    .goto('https://app.tophat.com/e/' + id)
    .wait('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-u91evt-0.hEpkwo > div > nav > ul > li:nth-child(2) > a')
    .wait(2000)
    .click('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-u91evt-0.hEpkwo > div > nav > ul > li:nth-child(2) > a')
    .wait('#region-content > div > div > button.btn.btn-legacy.enter')
    .wait(2000)
    .click('#region-content > div > div > button.btn.btn-legacy.enter')
    .wait('a.student > span:nth-child(2)')
    .wait(2000)
    .click('a.student > span:nth-child(2)')
    .wait('#gradebook-export-dropdown > span.caret')
    .wait(2000)
    .click('#gradebook-export-dropdown > span.caret')
    .wait('.export-current-page > span:nth-child(2)')
    .wait(2000)
    .click('.export-current-page > span:nth-child(2)')
    .waitDownloadsComplete()
    .end()
    .then()
    .catch((error) => {
      console.error('Nightmare Error:', error)
    })

  return returnFilePath
}

async function main() {
  for (var key in sections) {
    var gradeFilePath = await getGrades(key, sections[key])
    var absenceFilePath = await getAbsences(key, sections[key])
    await processFiles(gradeFilePath, absenceFilePath, sections[key])
  }
}

main()
