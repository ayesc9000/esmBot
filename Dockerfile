# Docker/Podman/Kubernetes file for running the bot

# Enable/disable usage of ImageMagick
ARG MAGICK="1"

FROM node:lts-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app
RUN apk --no-cache upgrade
RUN apk add --no-cache msttcorefonts-installer freetype fontconfig \
		vips vips-cpp grep libltdl icu-libs zxing-cpp
RUN update-ms-fonts && fc-cache -fv
RUN mkdir /built

# Path without ImageMagick
FROM base AS native-build-0
RUN apk add --no-cache git cmake python3 alpine-sdk \
		fontconfig-dev vips-dev zxing-cpp-dev

# Path with ImageMagick
FROM base AS native-build-1
RUN apk add --no-cache git cmake python3 alpine-sdk \
    zlib-dev libpng-dev libjpeg-turbo-dev freetype-dev fontconfig-dev \
    libtool libwebp-dev libxml2-dev \
		vips-dev libc6-compat zxing-cpp-dev

# liblqr needs to be built manually for magick to work
# and because alpine doesn't have it in their repos
RUN git clone https://github.com/carlobaldassi/liblqr ~/liblqr \
		&& cd ~/liblqr \
		&& ./configure --prefix=/built \
		&& make \
		&& make install

RUN cp -a /built/* /usr

# install imagemagick from source rather than using the package
# since the alpine package does not include liblqr support.
RUN git clone https://github.com/ImageMagick/ImageMagick.git ~/ImageMagick \
    && cd ~/ImageMagick \
    && ./configure \
		--prefix=/built \
		--disable-static \
		--disable-openmp \
		--with-threads \
		--with-png \
		--with-webp \
		--with-modules \
		--with-pango \
		--without-hdri \
		--with-lqr \
    && make \
    && make install

RUN cp -a /built/* /usr

FROM native-build-${MAGICK} AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-optional --frozen-lockfile
# Detect ImageMagick usage and adjust build accordingly
RUN if [[ "$MAGICK" -eq "1" ]] ; then pnpm run build ; else pnpm run build:no-magick ; fi

FROM native-build-${MAGICK} AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --no-optional --frozen-lockfile

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build/Release /app/build/Release
COPY --from=build /built /usr
RUN if [[ -f ".env" ]] ; then rm .env ; fi

RUN mkdir /app/help && chmod 777 /app/help
RUN mkdir /app/temp && chmod 777 /app/temp
RUN mkdir /app/logs && chmod 777 /app/logs

ENTRYPOINT ["node", "app.js"]
