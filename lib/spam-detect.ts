// Scores a contact form submission for spam likelihood.
// Returns true if the message should be treated as spam.

const HIGH_SIGNALS = [
  "seo service", "link building", "backlink", "guest post", "off-page seo",
  "increase your rankings", "boost your rankings", "improve your rankings",
  "increase your traffic", "boost your traffic", "drive traffic",
  "digital marketing agenc", "web design agenc", "software development compan",
  "we offer affordable", "affordable seo", "affordable marketing",
  "i noticed your website", "i came across your website", "i came across your site",
  "we noticed your website", "we came across your website",
  "get more leads", "generate more leads", "lead generation service",
  "social media marketing", "content marketing service",
  "email marketing service", "ppc management",
  "unsubscribe", "opt out", "this is not spam",
  "casino", "crypto investment", "binary option", "forex trading",
  "loan offer", "payday loan", "quick loan",
]

const MEDIUM_SIGNALS = [
  "our services", "our company offers", "we provide",
  "affordable price", "cheap price", "best price guarantee",
  "free quote", "free consultation", "no obligation",
  "click here", "visit our website", "check out our",
  "limited time offer", "act now", "don't miss",
  "100% guaranteed", "money back guarantee",
  "make money", "earn money", "passive income",
  "web traffic", "search engine", "keyword ranking",
]

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim()
}

export function isSpam(fields: { name: string; email: string; subject?: string | null; body: string }): boolean {
  const text = normalize([fields.name, fields.email, fields.subject ?? "", fields.body].join(" "))

  let score = 0

  for (const signal of HIGH_SIGNALS) {
    if (text.includes(signal)) score += 2
  }
  for (const signal of MEDIUM_SIGNALS) {
    if (text.includes(signal)) score += 1
  }

  // Multiple URLs in body is a strong spam signal
  const urlCount = (fields.body.match(/https?:\/\//gi) ?? []).length
  if (urlCount >= 2) score += 2
  if (urlCount >= 4) score += 2

  // Very short name + generic greeting is a soft signal
  if (fields.name.split(" ").length === 1 && fields.body.length < 80) score += 1

  return score >= 2
}
