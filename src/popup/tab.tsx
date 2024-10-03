import * as Form from "@radix-ui/react-form"
import React, { useEffect, useState } from "react"

type TabInfo = {
  url: string
  title: string
  favIconUrl: string
}
const Tab = () => {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null)
  // 获取当前标签页信息
  const getTabInfo = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0]
      const { url, title, favIconUrl } = currentTab

      setTabInfo({ url, title, favIconUrl })
    })
  }

  useEffect(() => {
    getTabInfo()
  }, [])

  return (
    <div className="px-10 py-6 w-[300px] flex flex-col items-center justify-center">
      <h1 className="text-xl font-medium mb-4">Add Bookmark</h1>
      {tabInfo && (
        <Form.Root className="w-full">
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
            <Form.Message match="valueMissing">Title is required</Form.Message>
          </Form.Field>
          <Form.Field name="description" className="mt-4">
            <Form.Label className="text-sm font-medium">Description</Form.Label>
            <Form.Control asChild>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                defaultValue=""
              />
            </Form.Control>
          </Form.Field>

          {/* <Form.Field name="tags" className="mt-4">
            <Form.Label className="text-sm font-medium">Tags</Form.Label>
            <Form.Control asChild>
              <input
                className="w-full px-3 py-2 border rounded-md"
                type="text"
                placeholder="Enter tags separated by commas"
              />
            </Form.Control>
          </Form.Field> */}

          {/* <Form.Field name="folderId" className="mt-4">
            <Form.Label className="text-sm font-medium">Folder</Form.Label>
            <Form.Control asChild>
              <select className="w-full px-3 py-2 border rounded-md">
                <option value="">Select a folder (optional)</option>

              </select>
            </Form.Control>
          </Form.Field> */}
          <Form.Submit asChild>
            <button className="mt-6 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
              Save Bookmark
            </button>
          </Form.Submit>
        </Form.Root>
      )}
    </div>
  )
}

export default Tab
