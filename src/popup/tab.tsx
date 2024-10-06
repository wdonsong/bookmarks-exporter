import { EVENT_GET_TAB_INFO, EVENT_SAVE_TAB_INFO } from "@/lib/events"
import type { TabInfo } from "@/lib/types"
import * as Form from "@radix-ui/react-form"
import React, { useEffect, useState } from "react"

const Tab = () => {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null)
  // 获取当前标签页信息
  const getTabInfo = () => {
    // 查找当前活动的标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0]

      // 发消息给 content script
      chrome.tabs.sendMessage(
        currentTab.id,
        { type: EVENT_GET_TAB_INFO },
        (response) => {
          console.log("收到content的响应:", response)
          setTabInfo(response)
        }
      )
    })
  }

  useEffect(() => {
    getTabInfo()
  }, [])

  // 发送tabInfo到background的函数
  const sendTabInfoToBackground = (event: React.FormEvent) => {
    event.preventDefault() // 阻止表单默认提交行为
    if (tabInfo) {
      chrome.runtime.sendMessage(
        { type: EVENT_SAVE_TAB_INFO, data: tabInfo },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "发送消息到background时出错:",
              chrome.runtime.lastError
            )
          } else {
            console.log("收到background的响应:", response)
            // 这里可以添加成功保存后的操作，比如显示提示信息
            if (response.success) {
              // 关闭popup
              window.close()
              // alert(response.message)
            } else {
              // alert(response.message)
              window.close()
            }
          }
        }
      )
    }
  }

  return (
    <div className="px-10 py-6 w-[300px] flex flex-col items-center justify-center">
      <h1 className="text-xl font-medium mb-4">Add Bookmark</h1>
      {tabInfo && (
        <Form.Root className="w-full" onSubmit={sendTabInfoToBackground}>
          <Form.Field name="title" className="mt-4">
            <Form.Label className="text-sm font-medium">Title</Form.Label>
            <Form.Control asChild>
              <input
                className="w-full px-3 py-2 border rounded-md"
                type="text"
                required
                defaultValue={tabInfo.title}
              />
            </Form.Control>
            <Form.Message match="valueMissing" className="text-red-500">
              Title is required
            </Form.Message>
          </Form.Field>
          <Form.Field name="description" className="mt-4">
            <Form.Label className="text-sm font-medium">Description</Form.Label>
            <Form.Control asChild>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                defaultValue={tabInfo.description}
              />
            </Form.Control>
          </Form.Field>

          <Form.Submit asChild>
            <button
              className="mt-6 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
              type="submit">
              Save Bookmark
            </button>
          </Form.Submit>
        </Form.Root>
      )}
    </div>
  )
}

export default Tab
