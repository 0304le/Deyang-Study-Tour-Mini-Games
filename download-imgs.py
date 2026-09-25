# -*- coding: utf-8 -*-
"""批量下载游戏图片到 assets/img（一次性工具脚本）"""
import os
import time
import urllib.parse
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'img')
BASE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt='
os.makedirs(OUT, exist_ok=True)

JOBS = [
    ('g1-1-baimaguan.png', 'square_hd', '四川德阳白马关古蜀道关隘古战场，三国风格城墙关楼旌旗，远山苍茫，国风写实历史插画，方形构图，细节丰富'),
    ('g1-2-wenmiao.png', 'square_hd', '四川德阳文庙大成殿全景，红墙黄瓦古建筑群，棂星门泮池，古柏参天，国风写实建筑插画，方形构图'),
    ('g1-3-sanxingdui.png', 'square_hd', '三星堆青铜面具特写，神秘夸张纵目面具，金色面罩，古蜀文明祭祀场景，国风写实考古插画，方形构图'),
    ('g5-1-linhai.png', 'landscape_16_9', '四川龙门山原始山林全景插画，层叠青山云雾溪流，国风工笔自然画风。画面左侧溪边有一棵开着白色苞片花朵的珙桐树（鸽子花树）；画面右侧的岩石旁站着一只红腹锦鸡，金色冠羽红色腹部，色彩艳丽；画面底部正前方前景处生长着几丛绿色蕨类植物。景物与山林融为一体，像隐藏在画中'),
    ('g5-2-xigu.png', 'landscape_16_9', '四川龙门山深山溪谷湿地全景插画，清澈溪流穿过苔藓岩石，两侧长满高大蕨类般的桫椤树，国风工笔画风。画面左下角浅水里趴着一只褐色大鲵（娃娃鱼），有扁扁的头和四条短腿；画面右侧溪石上站着一只洁白的白鹭，细长腿长脖子；画面中上部左侧崖壁旁生长着一棵高大的桫椤树，巨大的羽状叶片如伞。景物隐藏在溪谷环境中'),
    ('g5-3-huahai.png', 'landscape_16_9', '四川龙门山高山草甸全景插画，远处雪山云雾，近处开满高山杜鹃花丛，国风工笔自然画风。画面左侧一丛粉红色高山杜鹃花丛中，趴着一只红棕色的小熊猫，毛茸茸的环纹尾巴；画面右侧岩石上站着一只绿尾虹雉，羽毛闪着金属绿紫色光泽；画面底部前景是一大丛盛开的粉红色高山杜鹃花。生灵巧妙隐藏在高山环境中'),
    ('g6-dry.png', 'landscape_4_3', '四川梯田水稻严重干旱场景，龟裂的水田泥土，枯黄萎靡的稻禾，烈日当空，写实农业插画'),
    ('g6-ok.png', 'landscape_4_3', '四川梯田水稻成熟丰收场景，金黄饱满的稻穗健康挺立，水面倒映蓝天，阳光明媚，写实农业插画'),
    ('g6-bad.png', 'landscape_4_3', '连日暴雨后四川稻田洪涝场景，水稻被风雨吹打折断倒伏泡在积水中，天空灰暗雨幕，写实农业插画'),
    ('g7-scene.png', 'landscape_4_3', '四川德阳孝泉古镇正月十六拉保保民俗场景，青瓦古街张灯结彩，人群热闹，母亲抱着幼童给路人戴红色宝宝帽认干爹，喜庆中国红，国风民俗插画'),
    ('g8-1-xiangfeng.png', 'square_hd', '蜀锦织锦纹样方形图案特写，对称构图的翔凤穿花纹，一只凤凰展翅飞舞穿梭于团花祥云之间，传统红金配色，织纹精致繁复高清'),
    ('g8-2-badayun.png', 'square_hd', '蜀锦织锦纹样方形图案特写，八达晕几何骨架纹，米字格与圆形套叠的对称几何网络，骨架内填花卉如意纹，宋代风格红褐金配色，织纹精致高清'),
    ('g8-3-tianma.png', 'square_hd', '蜀锦织锦纹样方形图案特写，联珠天马纹，圆形连珠纹圈环内一匹带翼天马昂首奔腾，唐代风格深蓝底配金橙联珠，织纹精致高清'),
    ('g8-4-denglong.png', 'square_hd', '蜀锦织锦纹样方形图案特写，灯笼八吉纹，一盏盏宫灯造型对称排列，灯下垂流苏与盘长结、八吉祥纹样，明代风格红金喜庆配色，织纹精致高清'),
    ('g9-dish.png', 'square', '四川名菜连山回锅肉成品菜特写，大片五花肉与青蒜苗同炒，红油发亮灯盏窝形，热气腾腾，美食摄影'),
]

for fname, size, prompt in JOBS:
    path = os.path.join(OUT, fname)
    if os.path.exists(path) and os.path.getsize(path) > 10000:
        print('SKIP %s exists' % fname, flush=True)
        continue
    url = BASE + urllib.parse.quote(prompt) + '&image_size=' + size
    done = False
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=120) as r, open(path, 'wb') as f:
                f.write(r.read())
            sz = os.path.getsize(path)
            if sz > 10000:
                done = True
                print('OK %s %d bytes' % (fname, sz), flush=True)
                break
            else:
                print('SMALL %s %d bytes (try %d)' % (fname, sz, attempt), flush=True)
        except Exception as e:
            print('FAIL %s try%d : %s' % (fname, attempt, e), flush=True)
            time.sleep(3)
    if not done:
        print('GIVEUP %s' % fname, flush=True)

print('=== ALL DONE ===', flush=True)
