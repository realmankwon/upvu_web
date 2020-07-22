import React, {Component} from "react";

import {History} from "history";

import {Button, ButtonProps} from "react-bootstrap";

import {Community} from "../../store/community/types";

import {_t} from "../../i18n";

interface Props {
    history: History;
    community: Community;
    buttonProps?: ButtonProps;
}

export default class CommunityPostBtn extends Component<Props> {
    clicked = () => {
        const {community, history} = this.props;
        history.push(`/submit?com=${community.name}`);
    }

    render() {
        const {buttonProps} = this.props;

        return <Button onClick={this.clicked} {...buttonProps}>{_t("community.post")}</Button>
    }
}