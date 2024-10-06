// import { Logo } from "@/components/icons"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { toast, Toaster } from "sonner"

import {
  EVENT_AUTH_STATUS,
  EVENT_CHECK_PINTREE_EXTENSION_INSTALLED,
  EVENT_CONFIRM_PINTREE_EXTENSION_INSTALLED,
  EVENT_GET_TAB_INFO,
  EVENT_PINTREE_SYNC_BOOKMARKS
} from "./lib/events"
import type { TabInfo } from "./lib/types"

export const config: PlasmoCSConfig = {}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const Sonner = () => {
  return (
    // <div className="w-10 h-10 bg-red-500">
    // {/* <div className=" w-10 h-10 test-my-toast"> */}
    <div className="w-100 h-100 pointer-events-none">
      <Toaster
        toastOptions={{
          style: {
            background: "gray"
          }
        }}
      />
    </div>
    // {/* </div> */}
    // </div>
  )
}

export default Sonner

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
          toast.error("Failed to sync bookmarks. Please try again later.", {
            duration: 3000
          })
        } else {
          console.log("收到background的响应:", response)
          toast.success("Bookmarks synced successfully", { duration: 2000 })
        }
      }
    )
  }

  //通知background脚本，auth成功，保存cookie
  if (event.data.type && event.data.type === EVENT_AUTH_STATUS) {
    chrome.runtime.sendMessage({ type: EVENT_AUTH_STATUS }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("发送消息到background时出错:", chrome.runtime.lastError)
        toast.error(
          "Failed to update authentication status. Please log in again.",
          { duration: 3000 }
        )
      } else {
        console.log("收到background的响应:", response)
        if (response.success) {
          toast.success("Authentication status updated", { duration: 2000 })
        } else {
          toast.error(response.message, { duration: 3000 })
        }
      }
    })
  }
})

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("收到popup的消息:", message)
  if (message.type === EVENT_GET_TAB_INFO) {
    // 获取当前页面的标题和URL
    const tabInfo: TabInfo = {
      title: document.title,
      url: window.location.href
    }

    // 获取网站的所有favicon
    const favicons = document.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    )
    let faviconUrls = Array.from(favicons).map(
      (icon) => (icon as HTMLLinkElement).href
    )

    // 尝试获取根目录下的favicon.ico
    const rootFaviconUrl = new URL("/favicon.ico", window.location.origin).href
    faviconUrls.push(rootFaviconUrl)

    // 尝试获取manifest文件中的icons
    const manifestLink = document.querySelector('link[rel="manifest"]')
    const getManifestIcons = new Promise<string[]>((resolve) => {
      if (manifestLink) {
        fetch((manifestLink as HTMLLinkElement).href)
          .then((response) => response.json())
          .then((data) => {
            if (data.icons && Array.isArray(data.icons)) {
              const manifestIcons = data.icons.map(
                (icon) => new URL(icon.src, window.location.origin).href
              )
              resolve(manifestIcons)
            } else {
              resolve([])
            }
          })
          .catch(() => {
            resolve([])
          })
      } else {
        resolve([])
      }
    })

    // 获取description
    const description =
      document.querySelector('meta[name="description"]') ||
      document.querySelector('meta[name="description"]')
    if (description) {
      tabInfo.description = (description as HTMLMetaElement).content
    }

    // 获取og图片
    const ogImages = document.querySelectorAll('meta[property="og:image"]')
    tabInfo.ogImages = Array.from(ogImages).map(
      (img) => (img as HTMLMetaElement).content
    )

    // 等待所有图标获取完毕后再发送响应
    getManifestIcons
      .then((manifestIcons) => {
        faviconUrls = faviconUrls.concat(manifestIcons)
        // 去重
        tabInfo.favIconUrls = Array.from(new Set(faviconUrls))

        // 发送响应回popup
        sendResponse(tabInfo)
        console.log("发送响应回popup:", tabInfo)
        toast.success("Tab information retrieved successfully", {
          duration: 2000,
          style: {
            background: "white"
          },
          className: "toast-success-class"
        })
      })
      .catch((error) => {
        console.error("获取标签信息失败:", error)
        toast.error("Failed to retrieve tab information. Please try again.", {
          duration: 2000
        })
        sendResponse(null)
      })

    return true // 表示我们会异步发送响应
  }
})
