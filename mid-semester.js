const TOPHAT_RESULT = 'tophat.mid.out'
const UBLEARNS_RESULT = 'ublearns.mid.out'
const ABSENCE_THRESHOLD = 3
const cutoff = {
  'F' : 50,
  'D' : 58,
  'D+': 62,
  'C-': 66,
  'C' : 72,
  'C+': 76,
  'B-': 80,
  'B' : 84,
  'B+': 88,
  'A-': 92,
  'A' : 101,
}

function getOutput(type) {
  let output = {}
  let file = ''
  if (type == 'tophat') {
    file = TOPHAT_RESULT
  } else if (type == 'ublearns') {
    file = UBLEARNS_RESULT
  } else {
    return output
  }

  const fs = require('fs')
  let input = fs.readFileSync(process.cwd() + '/' + file, { encoding: 'utf8' })
  input = input.split('\n')

  for (let rowIndex in input) {
    if (input[rowIndex] == '') continue
    let row = input[rowIndex].split(',')
    if (type == 'tophat') {
      output[row[1]] = row.splice(4, 3)
    } else if (type == 'ublearns') {
      output[row[1]] = (row.splice(0, 1) + ',' + row.splice(1, 5)).split(',')
    } else {
      return output
    }
  }

  return output
}

function getInitialGrade(grade) {
  if (grade < cutoff['F']) {
    return 'F'
  } else if (grade < cutoff['D']) {
    return 'D'
  } else if (grade < cutoff['D+']) {
    return 'D+'
  } else if (grade < cutoff['C-']) {
    return 'C-'
  } else if (grade < cutoff['C']) {
    return 'C'
  } else if (grade < cutoff['C+']) {
    return 'C+'
  } else if (grade < cutoff['B-']) {
    return 'B-'
  } else if (grade < cutoff['B']) {
    return 'B'
  } else if (grade < cutoff['B+']) {
    return 'B+'
  } else if (grade < cutoff['A-']) {
    return 'A-'
  } else if (grade < cutoff['A']) {
    return 'A'
  } else {
    return undefined
  }
}

function getLetter(grade, absences) {
  let initialGrade = getInitialGrade(grade)

  let iteration = Math.floor(absences / ABSENCE_THRESHOLD)

  let realGrade = initialGrade
  for (let i = 0; i < iteration; ++i) {
    realGrade = downGrade(realGrade)
  }

  return [initialGrade, realGrade]
}

function downGrade(letter) {
  if (letter == 'A') {
    return 'A-'
  } else if (letter == 'A-') {
    return 'B+'
  } else if (letter == 'B+') {
    return 'B'
  } else if (letter == 'B') {
    return 'B-'
  } else if (letter == 'B-') {
    return 'C+'
  } else if (letter == 'C+') {
    return 'C'
  } else if (letter == 'C') {
    return 'C-'
  } else if (letter == 'C-') {
    return 'D+'
  } else if (letter == 'D+') {
    return 'D'
  } else if (letter == 'D') {
    return 'F'
  } else if (letter == 'F') {
    return 'F'
  } else {
    return undefined
  }
}

async function main() {
  /*
   * {
   *   email: [
   *     0 section,
   *     1 id,
   *     2 first name,
   *     3 last name,
   *     4 ublearns grade,
   *     5 ublearns max,
   *     6 tophat absences,
   *     7 tophat grade,
   *     8 tophat max,
   *     9 grade,
   *     10 initial letter grade,
   *     11 real letter grade,
   *   ]
   * }
   */
  let gradebook = {}
  let tophat = await getOutput('tophat')
  let ublearns = await getOutput('ublearns')

  for (let email in ublearns) {
    gradebook[email] = ublearns[email].concat(tophat[email])
  }

  for (let email in gradebook) {
    let row = gradebook[email]
    let grade = parseFloat(row[4]) + parseFloat(row[7])
    let max = parseFloat(row[5]) + parseFloat(row[8])
    grade = grade / max * 100.0
    row.push(grade)
    row = row.concat(getLetter(grade, row[6]))
    gradebook[email] = row
  }

  for (let email in gradebook) {
    let row = gradebook[email]
    //console.log('section: ' + row[0] + ', id: ' + row[1] + ', name: ' + row[2] + ' ' + row[3] + ', absences: ' + row[6] + ', grade: ' + row[9] + ', letter: ' + row[11])
    //if (row[11] == 'F' || row[11] == 'D' || row[11] == 'D+' || row[11] == undefined) {
    //  console.log(row[1] + ',' + 'MU')
    //} else {
    //  console.log(row[1] + ',' + 'MS')
    //}
    if (row[11] == 'F' || row[11] == undefined) {
      console.log(row[1] + ',' + 'MU')
    }
  }
}

main()
