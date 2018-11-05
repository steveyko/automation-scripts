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

function processFiles(xls0, xls1, section) {
  const xlsReader = require('xlsx')
  let workbookGrade = xlsReader.readFile(xls0)
  let workbookAbsence = xlsReader.readFile(xls1)
  let gradeSheet = workbookGrade.Sheets[workbookGrade.SheetNames[0]]
  let absenceSheet = workbookAbsence.Sheets[workbookAbsence.SheetNames[0]]
  /*
   * gradebook: section, email, firstName, lastName, absences, grade, total
   */
  let gradebook = {}

  /*
   * For grades,
   *
   * column C: email
   * column D: first name
   * column E: last name
   * column G: grade
   * column H: total
   */
  let row = 3 // The first two rows are the header
  let total = gradeSheet['H3'].v
  while (true) {
    let email = (gradeSheet['C' + row] ? gradeSheet['C' + row].v : undefined)
    let firstName = (gradeSheet['D' + row] ? gradeSheet['D' + row].v : undefined)
    let lastName = (gradeSheet['E' + row] ? gradeSheet['E' + row].v : undefined)
    let grade = (gradeSheet['G' + row] ? gradeSheet['G' + row].v : undefined)

    if (email == undefined) break
    if (grade == undefined) {
      console.log('No grade for ' + email)
      break
    }

    gradebook[email] = [section, email, firstName, lastName, grade, total]
    row++
  }

  /*
   * For absences,
   *
   * column E: email
   * column K: absences
   */
  row = 2 // The first row is the header
  while (true) {
    let email = (absenceSheet['E' + row] ? absenceSheet['E' + row].v : undefined)
    let absences = (absenceSheet['K' + row] ? absenceSheet['K' + row].v : undefined)

    if (email == undefined) break
    /*
     * section, email, firstName, lastName, absences, grade, total
     */
    gradebook[email].splice(4, 0, absences)
    row++
  }

  const fs = require('fs')
  fs.unlink(xls0, (err) => { if (err) throw err })
  fs.unlink(xls1, (err) => { if (err) throw err })

  for (let email in gradebook) {
    let data = gradebook[email]
    console.log(data[0] + ',' + data[1] + ',' + data[2] + ',' + data[3] + ',' + data[4] + ',' + data[5] + ',' + data[6])
  }
}

function getUsernamePassword() {
  const fs = require('fs')
  let input = fs.readFileSync(process.cwd() + '/' + PWD_FILE, { encoding: 'utf8' })
  input = input.split('\n')
  let username = input[0].trim()
  let password = input[1].trim()

  return [username, password]
}
  
async function getGrades(id, section) {
  const returnFilePath = process.cwd() + '/' + section + '.grades.xls'
  const Nightmare = require('nightmare')
  require('nightmare-download-manager')(Nightmare)
  let nightmare = Nightmare({
    show: true,
    paths: {
      downloads: process.cwd(),
    },
    waitTimeout: WAIT_TIMEOUT,
    gotoTimeout: GOTO_TIMEOUT,
    executionTimeout: EXECUTION_TIMEOUT,
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

  let usernamePassword = getUsernamePassword()
  let username = usernamePassword[0]
  let password = usernamePassword[1]

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
    .wait('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-s1rbkdy6-2.bKBYqH > button')
    .wait(2000)
    .click('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-s1rbkdy6-2.bKBYqH > button')
    .wait(3000)
    .goto('https://app.tophat.com/e/' + id)
    .wait('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-s13b0dbv-0.fprTmH > nav > ul > li:nth-child(2) > a')
    .wait(2000)
    .click('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-s13b0dbv-0.fprTmH > nav > ul > li:nth-child(2) > a')
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
      console.error('Error:', error)
    })

  return returnFilePath
}

async function getAbsences(id, section) {
  const returnFilePath = process.cwd() + '/' + section + '.absences.xls' 
  const Nightmare = require('nightmare')
  require('nightmare-download-manager')(Nightmare)
  let nightmare = Nightmare({
    show: true,
    paths: {
      downloads: process.cwd(),
    },
    waitTimeout: WAIT_TIMEOUT,
    gotoTimeout: GOTO_TIMEOUT,
    executionTimeout: EXECUTION_TIMEOUT,
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

  let usernamePassword = getUsernamePassword()
  let username = usernamePassword[0]
  let password = usernamePassword[1]

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
    .wait('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-s1rbkdy6-2.bKBYqH > button')
    .wait(2000)
    .click('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-s1rbkdy6-2.bKBYqH > button')
    .wait(3000)
    .goto('https://app.tophat.com/e/' + id)
    .wait('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-s13b0dbv-0.fprTmH > nav > ul > li:nth-child(2) > a')
    .wait(2000)
    .click('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-s13b0dbv-0.fprTmH > nav > ul > li:nth-child(2) > a')
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
      console.error('Error:', error)
    })

  return returnFilePath
}

async function main() {
  for (let key in sections) {
    let gradeFilePath = await getGrades(key, sections[key])
    let absenceFilePath = await getAbsences(key, sections[key])
    await processFiles(gradeFilePath, absenceFilePath, sections[key])
  }
}

main()
