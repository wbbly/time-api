import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context.host";
import { AuthenticationError } from "apollo-server-core";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);

    return ctx.getContext().req;
  }

  handleRequest(err: any, user: any, info: any) {
    //  if (err || !user) {
    //    throw err || new AuthenticationError('Could not authenticate with token check');
    //  }
    return user;
  }
}