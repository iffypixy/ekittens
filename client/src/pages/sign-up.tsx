import * as React from "react";
import {styled, List, ListItem} from "@mui/material";
import {Link} from "react-router-dom";
import {useForm} from "react-hook-form";

import {useDispatch} from "@app/store";
import {authModel} from "@features/auth";
import {Fullscreen, Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {
  H4,
  H5,
  Input,
  Text,
  Label,
  Button,
  InputHelper,
  Loader,
  FormControl,
} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";
import {regex} from "@shared/lib/regex";
import {FormVerification} from "@shared/api/common";
import {Notification} from "@shared/lib/notification";

export const SignUpPage: React.FC = () => (
  <Fullscreen>
    <Center>
      <Layout.Col w={40} gap={2}>
        <Layout.Col gap={1}>
          <Layout.Row align="center" gap={1}>
            <AddPersonIcon />

            <Layout.Row align="flex-end">
              <H4>register</H4>
              <HighlightedTitle>&nbsp;— for ekittens</HighlightedTitle>
            </Layout.Row>
          </Layout.Row>

          <AttendantText>Creating an account allows you to:</AttendantText>
        </Layout.Col>

        <Layout.Col>
          <FeaturesList>
            <Feature>add friends</Feature>
            <Feature>track personal stats</Feature>
            <Feature>upload your custom avatar</Feature>
            <Feature>play custom and rated games</Feature>
          </FeaturesList>
        </Layout.Col>

        <SignUpForm />

        <Details gap={2}>
          <WarningText>
            because there is <Emphasis>no email</Emphasis>, it is highly
            recommended that you store your password with the help of your
            browser after you register.
          </WarningText>

          <Layout.Row align="center" gap={1}>
            <Help>already have an account?</Help>
            <SignInLink to="/login">go sign in here.</SignInLink>
          </Layout.Row>
        </Details>
      </Layout.Col>
    </Center>
  </Fullscreen>
);

const AddPersonIcon = styled(Icon.AddPerson)`
  width: 4rem;
`;

const HighlightedTitle = styled(H5)`
  color: ${({theme}) => theme.palette.primary.main};
`;

const AttendantText = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const FeaturesList = styled(List)`
  list-style-type: square;
  margin-left: 3rem;
  padding: 0;
`;

const Feature = styled(ListItem)`
  color: ${({theme}) => theme.palette.text.primary};
  font-size: 1.2rem;
  text-transform: uppercase;
  display: list-item;
  padding-left: 0.25rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
`;

interface SignUpFormInputs {
  username: string;
  password: string;
}

interface SignUpFormVerification {
  username: FormVerification | null;
}

const SignUpForm: React.FC = () => {
  const dispatch = useDispatch();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isVerificationLoading, setIsVerificationLoading] =
    React.useState(false);

  const [verification, setVerification] =
    React.useState<SignUpFormVerification>({
      username: null,
    });

  const [error, setError] = React.useState<string | null>(null);

  const {handleSubmit, formState, register} = useForm<SignUpFormInputs>({
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
      minLength: {
        value: 5,
        message: "username must contain at least 5 characters",
      },
      maxLength: {
        value: 20,
        message: "username must not exceed 20 characters",
      },
      pattern: {
        value: regex.username,
        message: "username is not valid",
      },
    }),
    password: register("password", {
      required: {
        value: true,
        message: "password is required",
      },
      minLength: {
        value: 8,
        message: "password must contain at least 8 characters",
      },
      maxLength: {
        value: 100,
        message: "password must not exceed 100 characters",
      },
    }),
  };

  const handleFormSubmit = (data: SignUpFormInputs) => {
    const toSubmit = !isVerificationLoading;

    if (!toSubmit) return;

    setIsSubmitting(true);

    dispatch(authModel.actions.signUp(data))
      .unwrap()
      .catch(setError)
      .finally(() => setIsSubmitting(false));
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.username.onChange(event);

    setIsVerificationLoading(true);

    const username = event.currentTarget.value;

    dispatch(authModel.actions.verifyUsername({username}))
      .unwrap()
      .then((data) => setVerification({...verification, username: data}))
      .finally(() => setIsVerificationLoading(false));
  };

  const isUsernameTaken =
    Boolean(verification.username) && !verification.username!.ok;

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
          <FormControl
            variant="standard"
            error={Boolean(formState.errors.username || isUsernameTaken)}
          >
            <Label htmlFor="username">username</Label>
            <InputHelper>
              needs to be unique, no spaces or special characters
            </InputHelper>
            <Input
              {...form.username}
              onChange={handleUsernameChange}
              placeholder="iffypixy"
              id="username"
              type="text"
            />
            {isUsernameTaken && (
              <InputHelper>this username is taken :(</InputHelper>
            )}
          </FormControl>

          <FormControl
            variant="standard"
            error={Boolean(formState.errors.password)}
          >
            <Label shrink htmlFor="password">
              password
            </Label>
            <InputHelper>needs to be at least 8 characters</InputHelper>
            <Input
              {...form.password}
              placeholder="XXXXXXXXXXX"
              error={Boolean(formState.errors.password)}
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
            {isSubmitting ? "loading..." : "sign up"}
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

const WarningText = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 1.4rem;
  font-weight: 400;
  text-transform: uppercase;
`;

const Emphasis = styled(WarningText)`
  font-weight: 700;
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
