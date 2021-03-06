const { DateType } = require('@limit0/graphql-custom-types');
const uuid = require('uuid/v4');
const { notify, thank } = require('../mailer');
const env = require('../env');
const s3Client = require('../s3-client');
const {
  retrieve,
  insert,
  complete,
  submissions,
  submissionCount,
} = require('../mongodb');

const {
  PLATFORM_URI,
  PLATFORM_LOGO,
  PLATFORM_SECTIONS,
  TENANT_KEY,
  AWS_S3_BUCKET,
} = env;

const config = {
  domain: PLATFORM_URI,
  logo: PLATFORM_LOGO,
  ids: PLATFORM_SECTIONS,
  isPmmi: /^pmmi_/.test(TENANT_KEY),
};

module.exports = {
  CompanyUpdateDate: DateType,

  CompanyUpdateSubmission: {
    id: ({ _id }) => _id.toString(),
    submitted: ({ _id }) => _id.getTimestamp(),
    payload: ({ payload }) => JSON.stringify(payload),
    companyName: ({ payload: { name } }) => name,
  },

  Query: {
    companyUpdateConfig: () => config,
    companyUpdateSubmission: (_, { id }) => retrieve(id),
    companyUpdateSubmissions: () => submissions(),
    companyUpdateSubmissionCount: () => submissionCount(),
  },
  Mutation: {
    companyUpdateSubmit: async (_, { input }) => {
      const reviewed = false;
      const res = await insert({ reviewed, ...input });
      if (!res.result.ok) throw new Error('Unable to save your changes, please try again.');
      const submission = await retrieve(res.insertedId);
      await notify(submission);
      await thank(submission);
      return submission;
    },
    companyUpdateComplete: async (_, { id }) => {
      await complete(id);
      return 'ok';
    },
    companyUpdateSingleUpload: async (_, { file }) => {
      const { stream, filename, mimetype } = await file;
      const Bucket = AWS_S3_BUCKET;
      const Key = `${TENANT_KEY}/${uuid()}/${filename}`;

      const response = await s3Client.upload({
        Bucket,
        Key,
        Body: stream,
        ACL: 'public-read',
        ContentType: mimetype,
      }).promise();
      return response.Location;
    },
  },
};
