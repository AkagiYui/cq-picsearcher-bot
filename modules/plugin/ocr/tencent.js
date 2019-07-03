/*
 * @Author: Jindai Kirin
 * @Date: 2019-07-02 14:02:41
 * @Last Modified by: Jindai Kirin
 * @Last Modified time: 2019-07-03 19:41:12
 */

import config from '../../config';
import _ from 'lodash';
import Path from 'path';
import Fse from 'fs-extra';

const { SecretId, SecretKey, Region } = config.picfinder.ocr.tencent;
const LOG_PATH = Path.resolve(__dirname, '../../../data/tencent.ocr.json');

let log = {
	m: new Date().getMonth(),
	c: 0
};
if (Fse.existsSync(LOG_PATH)) {
	let old = Fse.readJsonSync(LOG_PATH);
	if (old.m == log.m) log = old;
}

const tencentcloud = require('tencentcloud-sdk-nodejs');

const OcrClient = tencentcloud.ocr.v20181119.Client;
const models = tencentcloud.ocr.v20181119.Models;

const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;

let cred = new Credential(SecretId, SecretKey);
let httpProfile = new HttpProfile();
httpProfile.endpoint = 'ocr.tencentcloudapi.com';
let clientProfile = new ClientProfile();
clientProfile.httpProfile = httpProfile;
let client = new OcrClient(cred, Region || 'ap-hongkong', clientProfile);

/**
 * OCR 识别
 *
 * @param {string} url 图片地址
 * @returns
 */
function ocr(url) {
	let req = new models.GeneralAccurateOCRRequest();
	req.from_json_string(`{"ImageUrl":"${url}"}`);

	return new Promise((resolve, reject) => {
		if (log.c >= 950) {
			reject('API 免费额度可能即将用完，已自动阻止调用');
			return;
		}
		client.GeneralAccurateOCR(req, (errMsg, response) => {
			if (errMsg) {
				reject(errMsg);
				return;
			}

			log.c++;
			Fse.writeJsonSync(LOG_PATH, log);

			resolve(_.map(response.TextDetections, 'DetectedText'));
		});
	});
}

export default ocr;
