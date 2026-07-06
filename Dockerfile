FROM ruby:3.2-alpine

# Install system dependencies for Jekyll
RUN apk add --no-cache \
    build-base \
    git \
    nodejs \
    npm

# Set working directory
WORKDIR /srv/jekyll

# Copy Gemfile first for better caching
COPY Gemfile Gemfile.lock* ./

# Install Ruby dependencies
RUN bundle install

# Copy the rest of the site
COPY . .

# Expose Jekyll's default port
EXPOSE 4000 35729

# Serve with live reload
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload", "--force_polling"]
