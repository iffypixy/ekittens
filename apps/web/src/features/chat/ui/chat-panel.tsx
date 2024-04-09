import React from "react";
import {styled} from "@mui/material";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";
import {currentMatchModel} from "@features/current-match";

import {Button, Input, Text} from "@shared/ui/atoms";
import {Layout} from "@shared/lib/layout";

import {model} from "../model";

export const ChatPanel: React.FC = () => {
  const messages = useSelector(model.selectors.messages);

  return (
    <Layout.Col gap={2}>
      <Layout.Col style={{wordWrap: "break-word"}}>
        {messages.map((message) => (
          <Layout.Row key={message.id} align="center">
            <Text
              emphasis="secondary"
              size={1.4}
              weight={700}
              transform="uppercase"
              style={{overflow: "hidden"}}
            >
              {message.sender.username}:&nbsp;
            </Text>

            <Text style={{overflow: "hidden"}}>{message.text}</Text>
          </Layout.Row>
        ))}
      </Layout.Col>

      <Form />
    </Layout.Col>
  );
};

const Form: React.FC = () => {
  const {t} = useTranslation("common");

  const dispatch = useDispatch();

  const match = currentMatchModel.useMatch()!;

  const [text, setText] = React.useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.currentTarget.value);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text) return;

    dispatch(model.actions.sendMessage({chatId: match.id, text}));

    setText("");
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <Layout.Row gap={2}>
        <InputWrapper>
          <FormInput
            color="primary"
            onChange={handleInputChange}
            value={text}
          />
        </InputWrapper>

        <Button type="submit" variant="contained" color="info">
          {t("w.send")}
        </Button>
      </Layout.Row>
    </form>
  );
};

const InputWrapper = styled(Layout.Row)`
  flex: 1;
`;

const FormInput = styled(Input)`
  width: 100%;
`;
