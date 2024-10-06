import { Storage } from "@plasmohq/storage"

import {
  EVENT_AUTH_STATUS,
  EVENT_PINTREE_BOOKMARKS_SYNCED,
  EVENT_PINTREE_SYNC_BOOKMARKS,
  EVENT_SAVE_TAB_INFO,
  EVENT_SEND_BOOKMARKS
} from "../lib/events"
import type { TabInfo } from "../lib/types"

export {}

// 处理401错误的函数
const handle401Error = async (sendResponse: (response: any) => void) => {
  console.error("未授权：用户可能需要重新登录")
  const storage = new Storage()
  await storage.remove("sessionToken")
  sendResponse({
    success: false,
    message: "未授权，请重新登录。您的会话可能已过期，请重新登录以继续操作。"
  })
}

// 发送请求到服务器的函数
const sendRequestToServer = async (
  url: string,
  data: any,
  sessionToken: string
) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`
    },
    body: JSON.stringify(data)
  })

  if (response.status === 401) {
    throw new Error("Unauthorized")
  }

  return response.json()
}

// 获取会话令牌
const getSessionToken = async () => {
  const storage = new Storage()
  return await storage.get("sessionToken")
}

// 通用的请求处理函数
const handleRequest = async (
  url: string,
  data: any,
  sendResponse: (response: any) => void
) => {
  const sessionToken = await getSessionToken()
  if (!sessionToken) {
    console.error("pintree_session cookie not found")
    sendResponse({
      success: false,
      message: "未找到用户凭证，请重新登录以获取访问权限。"
    })
    return
  }

  try {
    const response = await sendRequestToServer(url, data, sessionToken)
    console.log("Server response:", response)
    sendResponse({
      success: true,
      message: "操作成功完成",
      data: response // 包含服务器返回的具体数据
    })
    return response
  } catch (error) {
    if (error.message === "Unauthorized") {
      handle401Error(sendResponse)
    } else {
      console.error("Error sending to server:", error)
      sendResponse({
        success: false,
        message: "操作失败",
        error: error.message // 包含具体的错误信息
      })
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case EVENT_PINTREE_SYNC_BOOKMARKS:
      chrome.action.openPopup(() => {
        if (chrome.runtime.lastError) {
          console.error("Error opening popup:", chrome.runtime.lastError)
          sendResponse({
            success: false,
            message: "打开弹出窗口失败",
            error: chrome.runtime.lastError.message
          })
        } else {
          console.log("Successfully opened popup")
          sendResponse({
            success: true,
            message: "成功打开弹出窗口，准备同步书签"
          })
        }
      })
      break

    case EVENT_AUTH_STATUS:
      chrome.cookies.get(
        { url: process.env.PLASMO_PUBLIC_PINTREE_URL, name: "pintree_session" },
        async (cookie) => {
          const storage = new Storage()
          if (cookie) {
            await storage.set("sessionToken", cookie.value)
            sendResponse({
              success: true,
              message: "用户凭证已成功保存",
              tokenSaved: true
            })
          } else {
            await storage.remove("sessionToken")
            sendResponse({
              success: false,
              message: "未找到用户凭证，请确保您已登录Pintree网站",
              tokenSaved: false
            })
          }
        }
      )
      break

    case EVENT_SEND_BOOKMARKS:
      handleRequest(
        `${process.env.PLASMO_PUBLIC_PINTREE_URL}/api/extension/exportBrowserBookmarks`,
        { bookmarks: message.data },
        sendResponse
      ).then((response) => {
        if (response) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              world: "MAIN",
              func: (message) => window.postMessage(message, "*"),
              args: [{ type: EVENT_PINTREE_BOOKMARKS_SYNCED }]
            })
          })
        }
      })
      break

    case EVENT_SAVE_TAB_INFO:
      handleRequest(
        `${process.env.PLASMO_PUBLIC_PINTREE_URL}/api/extension/addBookmark`,
        { tabInfo: message.data },
        sendResponse
      )
      break

    default:
      sendResponse({
        success: false,
        message: "未知的消息类型",
        receivedType: message.type
      })
      return false
  }

  return true // 表示我们会异步发送响应
})
