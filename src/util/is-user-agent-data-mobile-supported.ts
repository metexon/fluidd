type NavigatorWithUserAgentDataMobile = Navigator & {
  userAgentData: {
    mobile: boolean
  }
}

const isUserAgentDataMobileSupported = (navigator: Navigator): navigator is NavigatorWithUserAgentDataMobile => {
  if (!('userAgentData' in navigator)) return false

  const { userAgentData } = navigator

  return (
    userAgentData != null &&
    typeof userAgentData === 'object' &&
    'mobile' in userAgentData &&
    typeof userAgentData.mobile === 'boolean'
  )
}

export default isUserAgentDataMobileSupported
