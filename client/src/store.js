// src/store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the cards slice
const cardsSlice = createSlice({
    name: 'cards',
    initialState: {
        cards: [],
        isLoading: true,
        error: null,
    },
    reducers: {
        fetchCardsStart(state) {
            state.isLoading = true;
            state.error = null;
        },
        fetchCardsSuccess(state, action) {
            state.cards = action.payload;
            state.isLoading = false;
        },
        fetchCardsFailure(state, action) {
            state.cards = [];
            state.isLoading = false;
            state.error = action.payload;
        },
        addCard(state, action) {
            state.cards.push(action.payload);
        },
        updateCard(state, action) {
            const { id, updates } = action.payload;
            const index = state.cards.findIndex(card => card.id === id);
            if (index !== -1) {
                state.cards[index] = { ...state.cards[index], ...updates };
            }
        },
        deleteCard(state, action) {
            state.cards = state.cards.filter(card => card.id !== action.payload);
        },
        setCards(state, action) {
            state.cards = action.payload;
        },
    },
});

// Export actions
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
export const fetchCards = (userId) => async (dispatch) => {
    if (!userId) {
        dispatch(fetchCardsFailure("userId is undefined"));
        return;
    }

    dispatch(fetchCardsStart());
    try {
        const res = await axios.get(`http://localhost:5000/cards/${userId}`);
        console.log("Server response:", res.data);
        if (res.data === "Error") {
            console.error("Server returned an error while fetching cards");
            dispatch(fetchCardsSuccess([]));
        } else if (Array.isArray(res.data)) {
            dispatch(fetchCardsSuccess(res.data));
        } else {
            console.error('Unexpected response format:', res.data);
            dispatch(fetchCardsSuccess([]));
        }
    } catch (err) {
        console.error('Error fetching cards:', err);
        dispatch(fetchCardsFailure(err.message));
        dispatch(fetchCardsSuccess([]));
    }
};

// Configure the store
const store = configureStore({
    reducer: {
        cards: cardsSlice.reducer,
    },
});

export default store;