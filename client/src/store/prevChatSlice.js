import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	chats:[]
};

const prevChatSlice = createSlice({
    name: "chatHistory",
    initialState,
    reducers: {
		setChat:(state,action)=>{
			state.chats = action.payload;
		},
		deleteChat:(state)=>{
			state.chats = []
		}
    }
});

export const { setChat,deleteChat } = prevChatSlice.actions;
export default prevChatSlice.reducer;
