# Base image
FROM ghcr.io/jakoch/jupyter-devbox:latest

# Set the working directory
WORKDIR /root

# Install the specified Python packages
RUN pip install cvxopt image ipython ipythonblocks ipywidgets jupyter keras matplotlib networkx \
    numpy opencv-python pandas pillow pytest-cov qpsolvers scipy sortedcontainers tensorflow
