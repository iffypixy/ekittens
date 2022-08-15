import * as React from "react";
import {styled, FormControl} from "@mui/material";
import {Link} from "react-router-dom";
import {useForm} from "react-hook-form";

import {useDispatch} from "@app/store";
import {authModel} from "@features/auth";
import {Fullscreen, Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {H4, Input, Text, Label, Button, Loader} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";
import {Notification} from "@shared/lib/notification";

export const SignInPage: React.FC = () => (
  <Fullscreen>
    <Center>
      <Layout.Col w={40} gap={2}>
        <Layout.Col gap={1}>
          <Layout.Row align="center" gap={1}>
            <LoginIcon />

            <H4>sign in</H4>
          </Layout.Row>

          <AttendantText>Log in with your existing account.</AttendantText>
        </Layout.Col>

        <SignInForm />

        <Details>
          <Layout.Row align="center" gap={1}>
            <Help>no account?</Help>
            <SignInLink to="/register">go sign up here.</SignInLink>
          </Layout.Row>
        </Details>
      </Layout.Col>
    </Center>
  </Fullscreen>
);

const LoginIcon = styled(Icon.Login)`
  width: 4rem;
`;

const AttendantText = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
`;

interface SignInFormInputs {
  username: string;
  password: string;
}

const SignInForm: React.FC = () => {
  const dispatch = useDispatch();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {handleSubmit, formState, register} = useForm<SignInFormInputs>({
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const form = {
    username: register("username", {
      required: {
        value: true,
        message: "username is required",
      },
    }),
    password: register("password", {
      required: {
        value: true,
        message: "password is required",
      },
    }),
  };

  const handleFormSubmit = (data: SignInFormInputs) => {
    setIsSubmitting(true);

    dispatch(authModel.actions.signIn(data))
      .unwrap()
      .catch(setError)
      .finally(() => setIsSubmitting(false));
  };

  return (
    <>
      <Notification
        open={Boolean(error)}
        severity="error"
        message={error!}
        handleClose={() => setError(null)}
      />

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Layout.Col gap={2}>
          <FormControl variant="standard">
            <Label shrink htmlFor="username">
              username
            </Label>
            <Input
              {...form.username}
              placeholder="iffypixy"
              id="username"
              type="text"
            />
          </FormControl>

          <FormControl variant="standard">
            <Label shrink htmlFor="password">
              password
            </Label>
            <Input
              {...form.password}
              placeholder="XXXXXXXXXXX"
              id="password"
              type="password"
            />
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            startIcon={isSubmitting && <Spinner />}
            endIcon={!isSubmitting && <StartIcon />}
            disabled={!formState.isValid || isSubmitting}
          >
            {isSubmitting ? "loading..." : "sign in"}
          </Button>
        </Layout.Col>
      </form>
    </>
  );
};

const StartIcon = styled(Icon.Start)`
  fill: ${({theme}) => theme.palette.primary.contrastText};
  width: 2rem;
`;

const Spinner = styled(Loader.Spinner)`
  width: 2rem;
`;

const Details = styled(Layout.Col)`
  border-top: 1px solid ${({theme}) => theme.palette.divider};
  padding-top: 2rem;
`;

const Help = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 1.4rem;
  text-transform: uppercase;
`;

const SignInLink = styled(Link)`
  color: ${({theme}) => theme.palette.primary.main};
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
`;
