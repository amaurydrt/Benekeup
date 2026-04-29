FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY benedicte.jpg /usr/share/nginx/html/benedicte.jpg
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
