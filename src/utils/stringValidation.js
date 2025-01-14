const isValidString = (str) => {
    const regex = /^[a-zA-Z0-9\s]+$/;
    return typeof str === "string" && str.trim().length > 2 && regex.test(str);
};

const areValidStrings = (...fields) => {
    const regex = /^[a-zA-Z0-9\s]+$/;
    return fields.every(
        (field) =>
            typeof field === "string" &&
            field.trim().length > 0 &&
            regex.test(field)
    );
};
const isValidCode =(code)=> {
    // Check if code is a non-empty string and does not contain spaces or special characters
    return typeof code === 'string' && code.trim() !== '' && /^[^\s]+$/.test(code);
} 
const isValidEmployeeCode =(employeecode)=> {
    // Check if code is a non-empty string and does not contain spaces or special characters
    return typeof employeecode === 'string' && employeecode.trim() !== '' && /^[^\s]+$/.test(employeecode);
} 

const isValidDecimal = (value) => {
    const regex = /^[+-]?([0-9]+(\.[0-9]{1,2})?)$/;
    return regex.test(value);
};

const ValidString = (str) => {
     const hasAlphanumeric = /[a-zA-Z0-9]/.test(str);
     const hasOnlySpecialSymbols = /^[^a-zA-Z0-9]+$/.test(str);
  if (typeof str === "string" && str.trim().length > 2 && hasAlphanumeric) {
        return {
            isValid: true,
            message: "Valid string",
        };
    } else if (hasOnlySpecialSymbols) {
        return {
            isValid: false,
            message: "Invalid input: Cannot contain only special characters",
        };
    } else {
        return {
            isValid: false,
            message: "Invalid input",
        };
    }
};

export {isValidCode, isValidString, areValidStrings, isValidDecimal ,ValidString ,isValidEmployeeCode};
