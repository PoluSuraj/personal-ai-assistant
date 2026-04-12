import { configureStore } from "@reduxjs/toolkit"

import authSlice from './authSlice.js'
import chatTopic from './chatTopicSlice.js'
import chatHistory from "./prevChatSlice.js"

const store = configureStore(
    {
        reducer: {
			authSlice,
            chatTopic,
            chatHistory
        }
    }
)

export default store