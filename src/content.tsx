// import { Logo } from "@/components/icons"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"

import {
  EVENT_AUTH_STATUS,
  EVENT_CHECK_PINTREE_EXTENSION_INSTALLED,
  EVENT_CONFIRM_PINTREE_EXTENSION_INSTALLED,
  EVENT_PINTREE_SYNC_BOOKMARKS
} from "./lib/events"

export const config: PlasmoCSConfig = {}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const AppOverlay = () => {
  return (
    <div className="z-50 flex fixed top-32 right-4">
      {/* <Logo className="w-10 h-10 border rounded-full" /> */}
    </div>
  )
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return

  // 检查pintree扩展是否安装
  if (
    event.data.type &&
    event.data.type === EVENT_CHECK_PINTREE_EXTENSION_INSTALLED
  ) {
    // 回应检查消息
    console.log(event)
    window.postMessage({ type: EVENT_CONFIRM_PINTREE_EXTENSION_INSTALLED }, "*")
  }

  // 打开popup
  if (event.data.type && event.data.type === EVENT_PINTREE_SYNC_BOOKMARKS) {
    chrome.runtime.sendMessage(
      { type: EVENT_PINTREE_SYNC_BOOKMARKS },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("发送消息到background时出错:", chrome.runtime.lastError)
        } else {
          console.log("收到background的响应:", response)
        }
      }
    )
  }

  //通知background脚本，auth成功，保存cookie
  if (event.data.type && event.data.type === EVENT_AUTH_STATUS) {
    chrome.runtime.sendMessage({ type: EVENT_AUTH_STATUS }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("发送消息到background时出错:", chrome.runtime.lastError)
      } else {
        console.log("收到background的响应:", response)
      }
    })
  }
})

export default AppOverlay
