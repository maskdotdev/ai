from three.depth_limit_search import depth_limit_search
from utils import NodeValue, TreeNode, nodes


def iterative_deepening_search(problem: TreeNode) -> list[list[NodeValue]]:
    depth = 0
    overall_results: list[list[NodeValue]] = []
    while depth <= 3:
        res = depth_limit_search(problem, depth)
        print("res: ", res)
        overall_results.append(res)
        depth += 1

    return overall_results


if __name__ == "__main__":
    root = nodes()
    print("ids: ", iterative_deepening_search(root))
