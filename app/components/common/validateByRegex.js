export const validateByRegex = (itemType, itemInput) => {
  let re = new RegExp("")
  switch (itemType) {
    case "email":
      // re = new RegExp(process.env.NEXT_PUBLIC_EMAIL_REGEXP || "")
      re = /[^\s@]+@[^\s@]+\.[^\s@]+/
      break
    case "phone":
      // re = new RegExp(process.env.NEXT_PUBLIC_PHONE_REGEXP || "")
      re = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/
      break
  }
  return re.test(itemInput)
}
