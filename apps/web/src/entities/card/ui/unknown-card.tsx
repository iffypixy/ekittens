import React from "react";
import {css, styled} from "@mui/material";

import {Icon} from "@shared/ui/icons";
import {Card} from "./card";

export interface UnknownCardProps
  extends Omit<React.HTMLProps<HTMLDivElement>, "as"> {
  mini?: boolean;
  asIK?: boolean;
}

export const UnknownCard: React.FC<UnknownCardProps> = (props) =>
  props.asIK ? (
    <IKCard name="imploding-kitten" className={props.className} />
  ) : (
    <Wrapper mini={props.mini} {...props}>
      <QuestionIcon />
    </Wrapper>
  );

export interface WrapperStyledProps {
  mini?: boolean;
}

const IKCard = styled(Card)`
  width: 16rem;
  height: 21rem;
  margin: 0;
`;

const Wrapper = styled("div")<WrapperStyledProps>`
  width: 16rem;
  height: 21rem;
  border-radius: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom left, #ed1b24, #e75480);
  box-shadow: 0 0 7.5px 2px #f4b14d;
  cursor: pointer;

  ${({mini}) =>
    mini &&
    css`
      width: 3rem;
      height: 4rem;
      border-radius: 0.5rem;
      box-shadow: none;

      svg {
        width: 1.5rem;
      }
    `}
`;

const QuestionIcon = styled(Icon.Question)`
  fill: #fff;
  width: 10rem;
`;
