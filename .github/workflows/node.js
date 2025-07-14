name: Node.js CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
        # See supported Node.js release schedule at https://nodejs.org/en/about/releases/

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    # Update to actions/cache@v3
    - name: Cache npm and Vite build files
      uses: actions/cache@v3
      with:
        path: |
          ~/.npm
          node_modules/.vite
        key: ${{ runner.os }}-node-${{ matrix.node-version }}-build-${{ github.sha }}
        restore-keys: |
          ${{ runner.os }}-node-${{ matrix.node-version }}-build-

    - name: Install dependencies
      run: npm ci

    - name: Build app
      run: npm run build  # Or `vite build` if that’s how you’re building the app
