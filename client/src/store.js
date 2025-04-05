// store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const cardsSlice = createSlice({
    name: 'cards',
    initialState: {
        cards: [],
        isLoading: true,
        error: null,
    },
    reducers: {
        fetchCardsStart(state) {
            console.log("fetchCardsStart: Setting isLoading to true");
            state.isLoading = true;
            state.error = null;
        },
        fetchCardsSuccess(state, action) {
            console.log("fetchCardsSuccess: Setting cards to:", action.payload);
            state.cards = action.payload;
            state.isLoading = false;
        },
        fetchCardsFailure(state, action) {
            console.log("fetchCardsFailure: Setting error to:", action.payload);
            state.cards = [];
            state.isLoading = false;
            state.error = action.payload;
        },
        addCard(state, action) {
            console.log("addCard: Adding card:", action.payload);
            state.cards.push(action.payload);
        },
        updateCard(state, action) {
            const { id, updates } = action.payload;
            const index = state.cards.findIndex(card => card.id === id);
            if (index !== -1) {
                console.log("updateCard: Updating card with id:", id, "to:", updates);
                state.cards[index] = { ...state.cards[index], ...updates };
            }
        },
        deleteCard(state, action) {
            console.log("deleteCard: Deleting card with id:", action.payload);
            state.cards = state.cards.filter(card => card.id !== action.payload);
        },
        setCards(state, action) {
            console.log("setCards: Setting cards to:", action.payload);
            state.cards = action.payload;
        },
    },
});

export const {
    fetchCardsStart,
    fetchCardsSuccess,
    fetchCardsFailure,
    addCard,
    updateCard,
    deleteCard,
    setCards,
} = cardsSlice.actions;

// Thunk to fetch cards
export const fetchCards = ({ userId, boardId }) => async (dispatch) => {
    if (!userId || !boardId) {
        console.log("fetchCards: userId or boardId is undefined");
        dispatch(fetchCardsFailure("userId or boardId is undefined"));
        return;
    }

    dispatch(fetchCardsStart());
    try {
        const res = await axios.get(`http://localhost:5000/cards/${userId}/board/${boardId}`);
        console.log("fetchCards: Server response:", res.data);
        if (res.data === "Error") {
            console.error("fetchCards: Server returned an error while fetching cards");
            dispatch(fetchCardsSuccess([]));
        } else if (Array.isArray(res.data)) {
            dispatch(fetchCardsSuccess(res.data));
        } else {
            console.error('fetchCards: Unexpected response format:', res.data);
            dispatch(fetchCardsSuccess([]));
        }
    } catch (err) {
        console.error('fetchCards: Error fetching cards:', err);
        dispatch(fetchCardsFailure(err.message));
        dispatch(fetchCardsSuccess([]));
    }
};

const store = configureStore({
    reducer: {
        cards: cardsSlice.reducer,
    },
});

export default store;