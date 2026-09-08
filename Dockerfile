# 使用 Node 构建前端，运行镜像仅保留 Nginx 和静态文件
FROM node:24-alpine AS build

WORKDIR /app

RUN npm install --global pnpm@10.33.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:stable-alpine AS runtime

# 仅替换后端地址变量，保留 Nginx 自身变量
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
