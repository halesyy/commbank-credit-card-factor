
// div.account-wrapper
//    h3.account-name
//    span.monetary-value

// Iterates through all visible accounts, returning their values.
let getAccounts = () => {
  let accounts = [...document.querySelectorAll("div.account-wrapper")]
  let available = accounts.map(account => [
    account.querySelector("h3.account-name").innerHTML.trim(),
    account.querySelector("span.monetary-value").innerHTML.trim()
  ])
  return available
}

// Cards we cover/investigate.
let creditCards = ["Mastercard Ultimate"]
let spendingAccount = "Smart Access"

// Sends credit limit information to local storage.
let storeCreditLimitInfo = (accountName, creditLimit) => {
  chrome.storage.local.get({accountLimits: {}}, {accountLimits} => {
    accountLimits[accountName] = creditLimit
    chrome.storage.local.set({accountLimits})
    resolve(true)
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
    return false
  }
}
