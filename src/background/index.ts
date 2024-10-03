import { Storage } from "@plasmohq/storage"

import {
  EVENT_AUTH_STATUS,
  EVENT_PINTREE_BOOKMARKS_SYNCED,
  EVENT_PINTREE_SYNC_BOOKMARKS,
  EVENT_SEND_BOOKMARKS
} from "../lib/events"

export {}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === EVENT_PINTREE_SYNC_BOOKMARKS) {
    // 打开扩展的popup
    chrome.action.openPopup(() => {
      if (chrome.runtime.lastError) {
        console.error("打开popup时出错:", chrome.runtime.lastError)
      } else {
        console.log("成功打开popup")
      }
    })
    // 发送响应
    sendResponse({
      success: true,
      message: "已收到同步书签请求，正在打开popup"
    })
    return true // 表示我们会异步发送响应
  }
  if (message.type === EVENT_AUTH_STATUS) {
    // 从cookie中获取pintree_session
    chrome.cookies.get(
      { url: process.env.PLASMO_PUBLIC_PINTREE_URL, name: "pintree_session" },
      async (cookie) => {
        const storage = new Storage()
        if (cookie) {
          console.log(cookie)

          await storage.set("sessionToken", cookie.value)
          sendResponse({ success: true, message: "已成功保存用户凭据" })
        } else {
          await storage.remove("sessionToken")
          sendResponse({ success: false, message: "未找到用户凭据" })
        }
      }
    )

    // 返回true以表示我们将异步发送响应
    return true
  }

  if (message.type === EVENT_SEND_BOOKMARKS) {
    const sendBookmarks = async () => {
      const storage = new Storage()
      const sessionToken = await storage.get("sessionToken")
      if (sessionToken) {
        // 准备发送到服务器的数据
        const dataToSend = {
          bookmarks: message.data
        }

        // 发送数据到服务器
        fetch(`${process.env.PLASMO_PUBLIC_PINTREE_URL}/api/extension`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`
          },
          body: JSON.stringify(dataToSend)
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("服务器响应:", data)
            sendResponse({ success: true, message: "书签已成功发送到服务器" })

            //通知标签页已同步完毕
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              // chrome.action.setPopup({ popup: "", tabId: tabs[0].id })
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                world: "MAIN",
                func: sendMessageToPage,
                args: [{ type: EVENT_PINTREE_BOOKMARKS_SYNCED }]
              })

              sendResponse({
                success: true,
                message: "书签已成功发送到服务器"
              })
            })
          })
          .catch((error) => {
            console.error("发送到服务器时出错:", error)
            sendResponse({ success: false, message: "发送书签时出错" })
          })
      } else {
        console.error("未找到pintree_session cookie")
        sendResponse({ success: false, message: "未找到用户凭据" })
      }
    }
    sendBookmarks()

    // 返回true以表示我们将异步发送响应
    return true
  }
})

function sendMessageToPage(message) {
  window.postMessage(message, "*")
}
