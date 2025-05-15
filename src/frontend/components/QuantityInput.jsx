import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, IconButton, TextField } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

const QuantityInput = ({ min = 1, max = 99, onChange }) => {
  const [quantity, setQuantity] = useState(min);

  const handleDecrement = () => {
    if (quantity > min) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onChange && onChange(newQuantity);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      onChange && onChange(newQuantity);
    }
  };

  const handleInputChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= min && value <= max) {
      setQuantity(value);
      onChange && onChange(value);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <IconButton
        onClick={handleDecrement}
        disabled={quantity <= min}
        color="primary"
        size="small"
        aria-label="decrease quantity"
      >
        <RemoveIcon />
      </IconButton>
      <TextField
        type="number"
        value={quantity}
        onChange={handleInputChange}
        inputProps={{
          min,
          max,
          style: { textAlign: "center", width: "3rem" },
        }}
        size="small"
        variant="outlined"
      />
      <IconButton
        onClick={handleIncrement}
        disabled={quantity >= max}
        color="primary"
        size="small"
        aria-label="increase quantity"
      >
        <AddIcon />
      </IconButton>
    </Box>
  );
};

QuantityInput.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.func,
};

export default QuantityInput;
