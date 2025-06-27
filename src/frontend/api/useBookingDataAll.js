import { useState, useEffect } from "react";
import axios from "axios";

const useBooking = () => {
    const [booking, setBooking] = useState([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.REACT_APP_API_URL || "";

    useEffect(() => {
        const fetchFlights = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/getAllBookingData`);
                setBooking(response.data.data);
            } catch (error) {
                // console.error("Error fetching flights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();
    }, [apiUrl]);

    return { booking, loading };
};

export default useBooking;
