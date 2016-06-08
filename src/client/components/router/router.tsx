require('./router.css');

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { $, Expression, Executor, Dataset } from 'plywood';
import { Stage, Clicker, Essence, DataSource, Filter, Dimension, Measure } from '../../../common/models/index';
import { SvgIcon } from '../svg-icon/svg-icon';

export interface RouteProps extends React.Props<any> {
  fragment: string;
}

export interface RouteState {
}

export class Route extends React.Component<RouteProps, RouteState> {
  constructor() {
    super();
  }

  render() {
    return this.props.children as JSX.Element || null;
  }
}


export interface RouterProps extends React.Props<any> {
  onURLChange?: (breadCrumbs: string[]) => void;
  rootFragment?: string;
}

export interface RouterState {
  hash?: string;
}

export class Router extends React.Component<RouterProps, RouterState> {
  public mounted: boolean;

  constructor() {
    super();

    this.state = {};

    this.onHashChange = this.onHashChange.bind(this);
  }

  componentDidMount() {
    this.setState({hash: window.location.hash});
    window.addEventListener('hashchange', this.onHashChange);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.onHashChange);
  }

  parseHash(hash: string): string[] {
    const { rootFragment } = this.props;

    if (hash.charAt(0) === '#') hash = hash.substr(1);

    var breadCrumbs = hash.split('/');

    if (breadCrumbs[0] === rootFragment) breadCrumbs.shift();

    return breadCrumbs;
  }

  onHashChange(event: HashChangeEvent) {
    if (this.props.onURLChange) {
      this.props.onURLChange(this.parseHash(window.location.hash));
    }

    this.setState({hash: window.location.hash});
  }

  getFragments(): string[] {
    var children = this.props.children as JSX.Element[];

    const isNotRoute = (c: JSX.Element) => c.type !== Route;
    const hasNoFragment = (c: JSX.Element) => !c.props.fragment;

    if (children.some(isNotRoute) || children.some(hasNoFragment)) {
      throw new Error('Router only accepts Route elements with fragment as children');
    }

    return children.map((c) => c.props.fragment as string);
  }

  getQualifiedChild(candidates: JSX.Element[], crumbs: string[]): JSX.Element {
    var cloneChild = (child: JSX.Element, crumbs: string[], fragment: string): JSX.Element => {

      let newProps: any = {};
      fragment.split('/').forEach((bit, i) => {
        if (bit.charAt(0) !== ':') return;
        newProps[bit.slice(1)] = crumbs.shift();
      });

      return React.cloneElement(child, newProps);
    };

    var isRoute = (element: JSX.Element) => element.type === Route;

    for (let i = 0; i < candidates.length; i++) {
      let candidate = candidates[i];
      let fragment = candidate.props.fragment;
      let child: JSX.Element;

      if (!fragment) continue;

      if (crumbs[0] === fragment || fragment.charAt(0) === ':') {
        if (!(candidate.props.children instanceof Array)) {
          child = isRoute(candidate) ? candidate.props.children : candidate;
        } else if (crumbs.length === 1) {
          child = candidate.props.children.filter((child: JSX.Element) => !isRoute(child))[0];
        } else {
          child = this.getQualifiedChild(candidate.props.children, crumbs.slice(1));
        }

        if (child) return cloneChild(child, crumbs, fragment);
      }
    }

    return candidates.length > 0 ? candidates[0] : null;
  }

  render() {
    const { children } = this.props;
    const { hash } = this.state;

    if (hash === undefined) return <div/>;

    const breadCrumbs = this.parseHash(hash);

    if (!breadCrumbs || !breadCrumbs.length) return null;

    var qualifiedChild = this.getQualifiedChild(children as JSX.Element[], breadCrumbs);

    return qualifiedChild ? qualifiedChild : null;
  }
}
