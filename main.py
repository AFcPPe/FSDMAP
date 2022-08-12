import json

import folium
import datetime
from urllib.request import urlopen
import time

# ZBAA_OBS:6184:Harry:ATC:199.998:40.072500:116.597500:0:0::::::XFS:9:1:0:0:300::::::::::::::::::20220811151528:1478505520
# define the world map

national_map = folium.Map(location=[35.3, 100.6], zoom_start=4)
with open('FIRS.json',mode='r') as f:
    fir = json.load(f)
# display world map
def getData():
    req = urlopen('https://ol.xflysim.cn/whazzup.txt')
    whazzup = req.read().decode('utf-8')

    group = whazzup.split('\n')
    beg = False
    for each in group:
        jud = each[:6]
        if jud == '![Date':
            continue
        if jud == '!GENER':
            continue
        if jud == 'VERSIO':
            continue
        if jud == 'RELOAD':
            continue
        if jud == 'UPDATE':
            long = each[9:]
            year = long[:4]
            month = long[4:6]
            day = long[6:8]
            hour = long[8:10]
            minute = long[10:12]
            second = long[12:14]
            print(year, month, day, hour, minute, second)

            continue
        if jud == 'CONNEC':
            continue
        if jud == '!CLIEN':
            continue
        if jud == '!SERVE':
            continue
        if jud == 'XFS:ol':
            continue

        spGroup = each.split(':')
        if not spGroup[0] == '':
            if spGroup[3] == 'PILOT':
                lat = spGroup[5]
                long = spGroup[6]
                cs = spGroup[0]
                alt = spGroup[7]
                gs=spGroup[8]
                AT = spGroup[9]
                print(lat, long, cs)
                if lat=='' or long=='' or cs=='':
                    continue
                drawPilot(lat, long, cs,gs,alt,AT)
                continue
            if spGroup[3] == 'ATC':
                size = spGroup[19]
                lat = spGroup[5]
                long = spGroup[6]
                fac = spGroup[0].split('_')
                print(spGroup)
                drawATC(size, lat, long, fac[len(fac) - 1], spGroup[0], spGroup[1],fac[0],spGroup[4])

                continue
    return second

def getBoundary(name):
    for each in fir['features']:
        if each['properties']['id'] == name:
            return each
    return False

def drawATC(size, lat, long, fac, name, account,ICAO,freq):
    global national_map
    color='000000'
    # DEL #336600 深绿色
    # APN #0066FF 天蓝色
    # GND #66FF33 浅绿色
    # TWR #FF6633 橙黄色
    # APP #3333FF 深蓝色
    # CTR #FF3300 正红色
    # FSS #660000 深红色
    if fac == 'DEL':
        color = '#336600'
    else:
        if fac == 'APN':
            color = '#0066FF'
        else:
            if fac == 'GND':
                color = '#66FF33'
            else:
                if fac == 'TWR':
                    color = '#FF6633'
                else:
                    if fac == 'APP':
                        color = '#3333FF'
                    else:
                        if fac == 'CTR':
                            ar = getBoundary(ICAO)
                            if ar!=False:
                                folium.GeoJson(ar).add_child(folium.Popup(name+'('+account+')  '+freq,max_width=500)).add_to(national_map)
                                return
                            color = '#FF3300'
                        else:
                            if fac == 'FSS':
                                color = '#660000'
                            else:
                                return

    folium.Circle(
        radius=float(size) * 1000 * 1.852,
        location=(float(lat), float(long)),
        color=color,  # 颜色
        fill=True,
        fill_color=color  # 填充
    ).add_child(folium.Popup(name+'('+account+')  '+freq,max_width=500)).add_to(national_map)


def drawPilot(lat, long, cs,gs,alt,AT):
    global national_map
    folium.Marker(
        [float(lat), float(long)]
    ).add_child(folium.Popup(" 呼号:"+cs+" 机型:"+AT+" 高度:"+alt+" 地速:"+gs,max_width=500,)).add_to(national_map)


while 1:
    try:
        national_map = folium.Map(location=[35.3, 100.6], zoom_start=4)
        sec = int(getData())
        national_map.save('117.78.10.8/index.html')
        gt = datetime.datetime.now()
        if sec >= 30:
            while 1:
                time.sleep(1)
                now_time = datetime.datetime.now()
                if now_time.second >= sec - 30 and now_time.second < sec + 2:
                    break
        else:
            while 1:
                time.sleep(1)
                now_time = datetime.datetime.now()
                if now_time.second >= sec + 30 and now_time.second > sec - 2:
                    break
    except Exception as e:
        print(e)

