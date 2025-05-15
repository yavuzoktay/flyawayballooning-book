import { Box, FormControlLabel, Paper, Radio, RadioGroup, Typography } from "@mui/material";
import React from "react";

const AmtRadioCheck = ({ selectAmt, handleAmtChange, options }) => {
    return (
        <RadioGroup value={selectAmt} onChange={handleAmtChange}>
            {options.map((option) => (
                <Paper
                    key={option.value}
                    elevation={selectAmt === option.value ? 3 : 1}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        padding: "16px",
                        marginBottom: "8px",
                        border: selectAmt === option.value ? "2px solid #007FFF" : "1px solid #ddd",
                        borderRadius: "8px",
                    }}
                >
                    <FormControlLabel
                        value={option.value}
                        control={<Radio />}
                        label={
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                    {option.label} {option.price}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {option.description}
                                </Typography>
                            </Box>
                        }
                        sx={{ flexGrow: 1 }}
                    />
                </Paper>
            ))}
        </RadioGroup>
    )
}

export default AmtRadioCheck;