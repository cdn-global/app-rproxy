import {
  FiBook,
  FiGithub,
  FiGlobe,
  FiMail,
  FiPhone,
  FiTwitter,
} from "react-icons/fi"
import Logo from "../Common/Logo"
const Footer = () => {
  return (
    <footer className="w-full bg-[#c00d0f] py-4 text-white shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo
            src="/assets/images/roaming-proxy-network-logo.png"
            alt="Roaming Proxy Logo"
            imgClassName="w-20 md:w-28"
          />
          <p className="max-w-[200px] text-xs text-gray-100">
            Enterprise proxy and scraping solutions for web data.
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 text-xs md:items-start">
          <a
            href="tel:+18334353873"
            className="inline-flex items-center gap-2 transition hover:text-gray-200"
          >
            <FiPhone className="h-3.5 w-3.5" /> +1 (833) 435-3873
          </a>
          <a
            href="mailto:info@roamingproxy.com"
            className="inline-flex items-center gap-2 transition hover:text-gray-200"
          >
            <FiMail className="h-3.5 w-3.5" /> info@roamingproxy.com
          </a>
        </div>

        <div className="flex flex-col items-center gap-1 text-xs md:items-start">
          <a
            href="https://ROAMINGPROXY.com/resources/faq"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-200"
          >
            FAQ
          </a>
          <a
            href="https://ROAMINGPROXY.com/contact"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-200"
          >
            Help & Support
          </a>
        </div>

        <div className="flex flex-col items-center gap-1 text-xs md:items-start">
          <a
            href="https://ROAMINGPROXY.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-200"
          >
            Privacy Policy
          </a>
          <a
            href="https://ROAMINGPROXY.com/terms"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-200"
          >
            Terms of Service
          </a>
        </div>

        <div className="flex flex-col items-center gap-1 text-xs md:items-start">
          <a
            href="https://ROAMINGPROXY.com/cookie"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-200"
          >
            Cookie Policy
          </a>
          <a
            href="https://ROAMINGPROXY.com/compliance"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-200"
          >
            Compliance
          </a>
        </div>

        <div className="flex items-center gap-4 text-white">
          <a
            href="https://x.com/cobaltdata"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-gray-200"
          >
            <FiTwitter className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/cdn-global"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-gray-200"
          >
            <FiGithub className="h-4 w-4" />
          </a>
          <a
            href="https://cobaltdata.net"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-gray-200"
          >
            <FiGlobe className="h-4 w-4" />
          </a>
          <a
            href="https://docs.roamingproxy.com/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-gray-200"
          >
            <FiBook className="h-4 w-4" />
          </a>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-gray-100">
        © 2025
        <a
          href="https://ROAMINGPROXY.com"
          target="_blank"
          rel="noreferrer"
          className="mx-1 hover:text-gray-200"
        >
          ROAMINGPROXY.com
        </a>
        ,
        <a
          href="https://tradevaultllc.com/"
          target="_blank"
          rel="noreferrer"
          className="ml-1 hover:text-gray-200"
        >
          Trade Vault LLC
        </a>
        . All rights reserved.
      </p>
    </footer>
  )
}

export default Footer
