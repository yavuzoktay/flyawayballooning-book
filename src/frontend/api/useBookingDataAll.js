import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";

const useBooking = () => {
    const [booking, setBooking] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlights = async () => {
            try {
                const response = await axios.get(`${config.API_BASE_URL}/api/getAllBookingData`);
                setBooking(response.data.data);
            } catch (error) {
                // console.error("Error fetching flights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();
    }, []);

    return { booking, loading };
};

export default useBooking;
