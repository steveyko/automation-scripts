const WAIT_TIMEOUT = 60000
const GOTO_TIMEOUT = 60000
const EXECUTION_TIMEOUT = 60000
const PWD_FILE = 'pwd.in'

const sections = {
  '449785': 'A',
  '999753': 'B',
  '287174': 'C',
  '096176': 'D',
  '316904': 'E',
  '517380': 'F',
}

const THRESHOLD = 3 // greater than
  
function runNightmare(id, section, threshold) {
  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    show: true,
    waitTimeout: WAIT_TIMEOUT,
    gotoTimeout: GOTO_TIMEOUT,
    executionTimeout: EXECUTION_TIMEOUT,
   })

  nightmare.on('console', (type, msg) => {
    if (type == 'log') console.log(msg)
    else console.error(msg)
  })

  const fs = require('fs')
  let input = fs.readFileSync(process.cwd() + '/' + PWD_FILE, { encoding: 'utf8' })
  input = input.split('\n')
  let username = input[0].trim()
  let password = input[1].trim()
  console.log(username)
  console.log(password)

  nightmare
    .goto('https://myub.buffalo.edu')
    .wait('input#login')
    .insert('input#login', username)
    .insert('input#password', password)
    .click('input#login-button')
    .wait(4000)
    .goto('https://app.tophat.com/login')
    .wait('input#login-school-select')
    .wait(2000)
    .insert('input#login-school-select', 'University at Buffalo SUNY')
    .wait('.select-input__dropdown-option')
    .wait(2000)
    .click('.select-input__dropdown-option')
    .wait('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-s1wd2bfi-2.ctpVYB > button')
    .wait(2000)
    .click('#flux-app > div > div.login-main__content > main > div.login-main__sso > div.ToolTipstyles__WithToolTip-s1wd2bfi-2.ctpVYB > button')
    .wait(3000)
    .goto('https://app.tophat.com/e/' + id)
    //.wait('#flux-app > div > div > div.course_header > div.course_header_footer > nav > ul > li:nth-child(2) > a')
    //.wait(2000)
    //.click('#flux-app > div > div > div.course_header > div.course_header_footer > nav > ul > li:nth-child(2) > a')
    .wait('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-s13b0dbv-0.fprTmH > nav > ul > li:nth-child(2) > a')
    .wait(2000)
    .click('#flux-app > div > div > div.course_navigation_header__container > div.CourseHeaderstyles__CourseHeaderWrapper-s13b0dbv-0.fprTmH > nav > ul > li:nth-child(2) > a')
    .wait('#region-content > div > div > button.btn.btn-legacy.enter')
    .wait(2000)
    .click('#region-content > div > div > button.btn.btn-legacy.enter')
    .wait('#gradebook-beta-app > div.header-content > div > div > ul > li:nth-child(2) > a > span.tab-name')
    .wait(2000)
    .click('#gradebook-beta-app > div.header-content > div > div > ul > li:nth-child(2) > a > span.tab-name')
    .wait('#gradebook-beta-app > div.main-content > div > div > div.row.header-row > div > div > div:nth-child(3) > div > span > div')
    .wait(2000)
    .click('#gradebook-beta-app > div.main-content > div > div > div.row.header-row > div > div > div:nth-child(3) > div > span > div')
    .wait(2000)
    .evaluate((section, threshold) => {
      let i = 0
      let result = []

      while(true) {
        i++

        let name = document.querySelector('#gradebook-beta-app > div.main-content > div > div > ul > div > div:nth-child(' + i + ') > li > div > span.col-md-4.col-xs-4.student-info > span > span.item-name.main.fit-large-content > a').innerText
        let email = document.querySelector('#gradebook-beta-app > div.main-content > div > div > ul > div > div:nth-child(' + i + ') > li > div > span.col-md-4.col-xs-4.student-info > span > span:nth-child(3)').innerText
        if (!email.includes('buffalo.edu')) {
          email = document.querySelector('#gradebook-beta-app > div.main-content > div > div > ul > div > div:nth-child(' + i + ') > li > div > span.col-md-4.col-xs-4.student-info > span > span:nth-child(7)').innerText
        }
        if (!email) {
          email = document.querySelector('#gradebook-beta-app > div.main-content > div > div > ul > div > div:nth-child(' + i + ') > li > div > span.col-md-4.col-xs-4.student-info > span > span:nth-child(5)').innerText
        }

        let absences = document.querySelector('#gradebook-beta-app > div.main-content > div > div > ul > div > div:nth-child(' + i + ') > li > div > span:nth-child(3) > span > span.subheader-container > span:nth-child(3) > span').innerText

        if (parseInt(absences) > threshold) {
          console.log(section + ', ' + name + ', ' + email + ', ' + absences)
          result.push([name, email, absences])
        } else {
          break
        }
      }
      return result
    }, section, threshold)
    .end((result) => {
      //exports.result = result
    })
    .then()
    .catch((error) => {
      console.error('Error:', error)
    })
}

function main() {
  for (let key in sections) {
    runNightmare(key, sections[key], THRESHOLD)
  }
}

main()
