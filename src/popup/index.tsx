import "@/style.css"

import { AppProvider } from "@/context/app-context"
import { Route, HashRouter as Router, Routes } from "react-router-dom"

import Bookmark from "./bookmark"
import Export from "./export"
import Finish from "./finish"
import Home from "./home"
import Tab from "./tab"

function IndexPopup() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bookmark" element={<Bookmark />} />
          <Route path="/export" element={<Export />} />
          <Route path="/finish" element={<Finish />} />
          <Route path="/tab" element={<Tab />} />
        </Routes>
      </Router>
    </AppProvider>
  )
}

export default IndexPopup
