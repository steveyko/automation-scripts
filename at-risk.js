const SCROLL_TIME_WAIT = 15000
const TOPHAT_RESULT = 'tophat.out'
const UBLEARNS_RESULT = 'ublearns.out'
const URL = 'https://buffalo.campus.eab.com/...' // URL for the at-risk report

function getOutput(type) {
  let outputDict = {}

  let file = ''
  let index = 0
  let comment = ''
  if (type == 'tophat') {
    file = TOPHAT_RESULT
    index = 1
    reason = 'tophat'
  } else if (type == 'ublearns') {
    file = UBLEARNS_RESULT
    index = 0
    reason = 'ublearns'
  } else {
    return outputDict
  }

  const fs = require('fs')
  let input = fs.readFileSync(process.cwd() + '/' + file, { encoding: 'utf8' })
  input = input.split('\n')

  for (let rowIndex in input) {
    if (input[rowIndex] == '') continue
    let row = input[rowIndex].split(',')
    let name = row[index].trim().toLowerCase()
    outputDict[name] = reason
  }

  return outputDict
}

function getAtRiskDict() {
  return Object.assign({}, getOutput('tophat'), getOutput('ublearns'))
  //return { 'benji zhang': 'ublearns' }
}

function mainProcessing(atRiskDict, scrollTimeWait) {

  function markStudents() {
    const sectionMap = {
      1: 'A',
      2: 'B',
      3: 'C',
      4: 'D',
      5: 'E',
      6: 'F',
    }

    let rowCnt = 0
    for (let i = 1; i < 7; i++) {
      let table = document.querySelector('#bd > div > div > form > div.yui-g > div:nth-child(' + i + ') > table')
      let section = sectionMap[i]
      for (let j = 1, row; row = table.rows[j]; j++) {
        rowCnt++

        let name = row.cells[1].innerText.split(',')
        name = name[1].trim() + ' ' + name[0].trim()
        name = name.toLowerCase()

        if (!(name in atRiskDict)) continue

        console.log(section + ', ' + name + ', ' + atRiskDict[name])
        document.querySelector('#' + section + '-' + parseInt(j-1) + '-yes').click()
        //document.querySelector('#s2id_autogen' + rowCnt).value = atRiskDict[name]

        let optionIndex = 0
        if (atRiskDict[name] == 'tophat') optionIndex = 0
        else if (atRiskDict[name] == 'ublearns') optionIndex = 3
        else continue

        row.cells[3].lastElementChild.options[optionIndex].selected = true
        row.cells[6].firstElementChild.value = 'The instructors of CSE 199 are concerned about your academic performance. Please check your TopHat and UBlearns to see your current absences and recitation grades. Please also talk to your recitation instructor to discuss how to improve.'
      }
    }
  }

  document
    .querySelector('#bd > div > div > form > div.yui-g > div:nth-child(11)')
    .scrollIntoView(false)
  setTimeout(markStudents, scrollTimeWait)
}

function main() {
  const Nightmare = require('nightmare')
  const nightmare = Nightmare({ show: true })

  nightmare.on('console', (log, msg) => {
    if (log == 'log') console.log(msg)
    else console.error(msg)
  })

  nightmare
    .goto(URL)
    .evaluate(mainProcessing, getAtRiskDict(), SCROLL_TIME_WAIT)
    .wait(SCROLL_TIME_WAIT + 10000)
    //.click('#bd > div > div > form > div.yui-g > div:nth-child(8) > input')
    .wait(20000)
    .click('#bd > div > div > form > div.yui-g > div:nth-child(11) > input')
    //.end()
    .then()
    //.catch((error) => {
    //  console.error('Error:' + error)
    //})
}

main()
