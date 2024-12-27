import React from "react";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "./ui/form-control";
import { AlertCircleIcon } from "./ui/icon";
import { Input as UIInput, InputField } from "@/components/ui/input";

const Input = ({
  inputValue,
  setInputValue,
  type = "text",
  placeholder = "text",
  helperText = "text",
  errorText = "text",
  name = "text",
  valueName = "text",
  isDisabled = false,
  validation = false,
}: {
  inputValue: string;
  setInputValue: any;
  type?: "text" | "password";
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  name?: string;
  valueName?: string;
  isDisabled?: boolean;
  validation?: boolean;
}) => {
  return (
    <FormControl
      className="mx-4 mb-4"
      size="md"
      isInvalid={validation}
      isDisabled={isDisabled}
      isReadOnly={false}
      isRequired={false}
    >
      <FormControlLabel>
        <FormControlLabelText>{name}</FormControlLabelText>
      </FormControlLabel>
      <UIInput>
        <InputField
          className="h-12"
          type={type}
          placeholder={placeholder}
          value={inputValue}
          onChangeText={(text) => setInputValue(valueName, text)}
        />
      </UIInput>
      {helperText && (
        <FormControlHelper>
          <FormControlHelperText>{helperText}</FormControlHelperText>
        </FormControlHelper>
      )}
      <FormControlError>
        <FormControlErrorIcon as={AlertCircleIcon} />
        <FormControlErrorText>{errorText}</FormControlErrorText>
      </FormControlError>
    </FormControl>
  );
};

export default Input;
