import { Finish, Icon } from "@/components/icons"
import { MainFooter } from "@/components/main-footer"
import { Button } from "@/components/ui/button"
import { AppContext } from "@/context/app-context"
import { EVENT_SEND_BOOKMARKS } from "@/lib/events"
import { useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function FinishPopup() {
  const navigate = useNavigate()
  const { treeData } = useContext(AppContext)

  // 点击导出按钮后，将数据处理为 JSON 格式
  const onDownload = () => {
    const data = JSON.stringify(treeData, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pintree.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  // 发送书签数据到 background 并通知当前标签页
  const sendBookmark = () => {
    const data = JSON.stringify(treeData, null, 2)
    console.log("sendBookmarks")
    chrome.runtime.sendMessage(
      { type: EVENT_SEND_BOOKMARKS, data: treeData },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("发送消息时出错:", chrome.runtime.lastError)
          return
        }
        console.log("收到background的响应:", response)
        if (response.success) {
          // 关闭popup
          window.close()
        }
      }
    )
    // fetch(
    //   `${process.env.PLASMO_PUBLIC_PINTREE_URL}/api/extension/exportBrowserBookmarks`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //       // Authorization: `Bearer ${sessionToken}`
    //     },
    //     body: JSON.stringify({})
    //   }
    // )
  }

  return (
    <div className="py-6 w-[300px] flex flex-col items-center justify-center">
      <Finish className="w-32 h-32" />
      <div className="w-full space-y-3 mt-4 mb-9 px-6">
        <h1 className="text-xl font-normal text-center">Export Successful !</h1>
        <p className="text-lg font-light text-zinc-600 text-center">
          Click the button to download the json file
        </p>
      </div>

      <div className="w-full space-y-5 px-10">
        <Button
          className="text-[16px] font-light w-full py-4 flex items-center justify-center"
          onClick={sendBookmark}>
          <Icon
            icon="material-symbols:download-sharp"
            className="w-6 h-6 mr-2"
          />
          Download
        </Button>
        <MainFooter />
      </div>
    </div>
  )
}

export default FinishPopup
