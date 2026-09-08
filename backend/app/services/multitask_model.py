"""EfficientNet-B0 late2 branch: 소재 ECA, 카테고리 독립 tail.

학습 코드의 EffB0MultiHead_Late2Branch(linear, mat=eca, cat=none)
평가 경로만 유지한다. 라벨 순서는 multitask_config.json에 고정한다.
"""
import copy

import torch
from torch import nn
from torchvision.models import efficientnet_b0


class ECAAttention(nn.Module):
    def __init__(self, kernel_size):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.conv = nn.Conv1d(1, 1, kernel_size, padding=(kernel_size - 1) // 2, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        weights = self.avg_pool(x).squeeze(-1).squeeze(-1)
        weights = self.sigmoid(self.conv(weights.unsqueeze(1))).squeeze(1)
        return x * weights.unsqueeze(-1).unsqueeze(-1)


class TailBlocksWithAttention(nn.Module):
    def __init__(self, blocks, attention):
        super().__init__()
        self.blocks = nn.ModuleList(blocks)
        self.attn = attention

    def forward(self, x):
        for index, block in enumerate(self.blocks):
            x = block(x)
            if index == 1:  # global features[6]: 두 번째 late2 지점, 192채널
                x = self.attn(x)
        return x


class MultitaskEfficientNet(nn.Module):
    def __init__(self, material_count=8, category_count=12):
        super().__init__()
        backbone = efficientnet_b0(weights=None)
        features = list(backbone.features.children())
        self.shared = nn.Sequential(*features[:5])
        self.mat_attn0 = ECAAttention(3)  # features[4]: 80채널
        self.mat_attn1 = ECAAttention(5)  # features[6]: 192채널
        self.cat_attn0 = nn.Identity()
        self.cat_attn1 = nn.Identity()
        self.tail_mat = TailBlocksWithAttention(copy.deepcopy(features[5:]), self.mat_attn1)
        self.tail_cat = TailBlocksWithAttention(copy.deepcopy(features[5:]), self.cat_attn1)
        self.avgpool = backbone.avgpool
        self.dropout = backbone.classifier[0]
        self.head_mat = nn.Linear(1280, material_count)
        self.head_cat = nn.Linear(1280, category_count)

    def forward(self, x):
        shared = self.shared(x)
        material = self.tail_mat(self.mat_attn0(shared))
        category = self.tail_cat(self.cat_attn0(shared))
        material = self.dropout(torch.flatten(self.avgpool(material), 1))
        category = self.dropout(torch.flatten(self.avgpool(category), 1))
        return self.head_mat(material), self.head_cat(category)
