import { Logo } from "@/components/icons"
import { MainFooter } from "@/components/main-footer"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

import { useStorage } from "@plasmohq/storage/hook"

function HomePopup() {
  const navigate = useNavigate()
  const [pintreeSession, setPintreeSession] = useStorage("sessionToken")

  // 如果pintree_session不存在，则在新标签页中打开pintree.io
  const handleOpenPintree = () => {
    window.open(`${process.env.PLASMO_PUBLIC_PINTREE_URL}/auth/login`, "_blank")
  }

  return (
    <div className="px-10 py-6 w-[300px] flex flex-col items-center justify-center">
      <Logo className="w-20 h-20" />
      <div className="space-y-4 mt-6 mb-10">
        <h1 className="text-xl font-medium text-center">
          Pintree Bookmarks Exporter
        </h1>
        <p className="text-lg font-light text-zinc-600 text-center">
          Export Your Bookmarks to JSON File
        </p>
      </div>

      <div className="w-full space-y-5">
        {pintreeSession ? (
          <>
            {" "}
            <Button
              className="text-[16px] font-light w-full py-4"
              onClick={() => navigate("/tab")}>
              Bookmark this tab
            </Button>
            <Button
              className="text-[16px] font-light w-full py-4"
              onClick={() => navigate("/bookmark")}>
              Export Bookmarks
            </Button>
          </>
        ) : (
          <Button
            className="text-[16px] font-light w-full py-4"
            onClick={handleOpenPintree}>
            Login
          </Button>
        )}
        <MainFooter />
      </div>
    </div>
  )
}

export default HomePopup
