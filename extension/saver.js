
console.log("CommBank Smart Access After-credit is running! Thanks for using this local, free, trackless extension. Made without 💖 from Jack 😘")
console.log("If you find any issues or have feature requests, feel free to get in touch with me directly at me@jackhales.com!")

// @Author Jack Hales
// - https://jackhales.com
// - https://yourdataplace.com

// Account schema on "https://www.commbank.com.au/retail/netbank/home/":
// div.account-wrapper
//    h3.account-name
//    span.monetary-value

// Iterates through all visible accounts, returning their values.
let getAccounts = () => {
  let accounts = [...document.querySelectorAll("div.account-wrapper")]
  let available = []
  for (let account of accounts) {
    try {
      let name = account.querySelector("h3.account-name").innerHTML.trim()
      let value = parseFloat(account.querySelector("ul.account-balances li.is-bold span.monetary-value").getAttribute("title").trim().replace("$","").replace(/,/g, ""))
      available.push([name, value])
    } catch {
      // console.log("Parsing an account failed!", account)
    }
  }
  return available
}

// Cards we cover/investigate.
let creditCards = ["Mastercard Ultimate"]
let spendingAccount = "Smart Access"

// Sends credit limit information to local storage.
let storeCreditLimitInfo = (accountName, creditLimit) => {
  chrome.storage.local.get({accountLimits: {}}, ({accountLimits}) => {
    accountLimits[accountName] = creditLimit
    console.log("All your account limit data is:", accountLimits)
    chrome.storage.local.set({accountLimits})
  })
}

// Will inspect page for credit limit data to store in local storage.
let checkForCreditLimit = () => {
  try {
    // Acc name.
    let header = document.querySelector(".content_main")
    let accountName = header.querySelector(".account-name").innerHTML.trim()
    // C limit.
    let creditLimit = header.querySelector(".summaryCardLimit").querySelector("span").querySelector("span").innerHTML.trim()
    creditLimit = creditLimit.replace(/,/g, "")
    creditLimit = parseFloat(creditLimit)
    // Send to storage.
    storeCreditLimitInfo(accountName, creditLimit)
    return [accountName, creditLimit]
  } catch {
    console.log("Fetching credit card limit information failed.")
    return false
  }
}

// Given the local storage data + current available data, will
// attempt to calculate the offset.
let calculateCreditOffset = async available => {
  return new Promise((resolve, reject) => {
    let creditOffset = 0
    // Fetch the credit limits.
    chrome.storage.local.get({accountLimits: {}}, ({accountLimits}) => {
      for (let [accountName, availableValue] of available) {
        if (accountName in accountLimits) {
          // Calculate the limit (max), the available amount (after spending) and spend.
          let creditLimit = accountLimits[accountName]
          let creditAvailable = availableValue
          let creditSpent = creditLimit - creditAvailable
          // console.log(creditLimit, creditAvailable, creditSpent)
          // Make sure only adding numbers.
          if (!isNaN(creditSpent)) {
            creditOffset += creditSpent
          }
        }
      }
      resolve(creditOffset)
    })
  })
}

// Go over the given accounts, and if there's a credit
// which can be calculated out, then use it and apply it
// to the smart access value.
let overlayFindings = () => {
  // Get the smart access available DOM element.
  let available = getAccounts() // [accountName, available]
  let accountNames = available.map(account => account[0])
  let accountIndex = accountNames.indexOf(spendingAccount)
  let everydayAccountDom = [...document.querySelectorAll("div.account-wrapper")][accountIndex]
  let everydayValue = available[accountIndex][1]
  // console.log(everydayValue)

  // Calculate credit offset for avail.
  calculateCreditOffset(available).then(offset => {
    let everydayAfter = everydayValue - offset
    everydayAfter = everydayAfter.toFixed(2) // parse to float
    everydayAfter = `$${everydayAfter}`
    // console.log("Everyday after is", everydayAfter)

    // Find the available amount and change it to view.
    let priceDom = everydayAccountDom.querySelector("ul.account-balances li.is-bold span.monetary-value")
    priceDom.innerHTML = everydayAfter
    // priceDom.style = "color: gray;"
  })

}

setTimeout(checkForCreditLimit, 500)
setInterval(checkForCreditLimit, 10000) // Check the users page every 10s for a credit limit.

setTimeout(overlayFindings, 100)
setTimeout(overlayFindings, 200)
setTimeout(overlayFindings, 500)
setInterval(overlayFindings, 2500)
