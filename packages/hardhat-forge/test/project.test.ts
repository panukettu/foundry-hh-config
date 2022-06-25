import { assert, expect } from "chai";
import {
  TASK_CLEAN,
  TASK_CLEAN_GLOBAL,
} from "hardhat/builtin-tasks/task-names";
import { getCacheDir } from "hardhat/internal/util/global-dir";
import fsExtra from "fs-extra";
import path from "path";
import { useEnvironment, getAllFiles } from "./helpers";

describe("Integration tests", function () {
  this.timeout(300000);
  describe("Hardhat Runtime Environment extension", function () {
    useEnvironment("hardhat-project");

    it("Should build", async function () {
      await this.hre.run("compile");
    });

    it("Should test", async function () {
      await this.hre.run("test");
    });

    it("Should return config", async function () {
      const config = await this.hre.run("forge:config");
      assert.equal(config.src, "src");
      assert.equal(config.out, "forge/artifacts");
    });

    it("Should populate hre.config.foundry", async function () {
      assert.exists(this.hre.config.foundry);
      assert.typeOf(this.hre.config.foundry, "object");
    });

    it("Should read artifacts", async function () {
      const artifacts = await this.hre.artifacts.getArtifactPaths();
      assert.isNotEmpty(artifacts);
      const contract = await this.hre.artifacts.readArtifact("Contract");
      assert.equal(contract.sourceName, "src/Contract.sol");
      assert.exists(contract.abi);
      assert.exists(contract.bytecode);
      assert.typeOf(contract.bytecode, "string");
      assert.exists(contract.deployedBytecode);
      assert.typeOf(contract.deployedBytecode, "string");
      assert.exists(contract.linkReferences);
      assert.exists(contract.deployedLinkReferences);
      assert.exists(contract.contractName);
      assert.exists(contract.sourceName);
    });

    it("Should write artifacts to disk", async function () {
      const artifacts = await this.hre.artifacts.getArtifactPaths();
      const files = await getAllFiles(this.hre.config.paths.artifacts);
      // filter out the debug files
      const filtered = files.filter((f) => !f.includes(".dbg.json"));
      assert.equal(artifacts.length, filtered.length);

      for (const file of filtered) {
        const name = path.basename(file);
        assert(artifacts.map((a) => path.basename(a)).includes(name));
        const artifact = require(file);
        assert.equal(artifact.contractName, path.basename(name, ".json"));
      }
    });

    it("Should write debug files to disk", async function () {
      const debugFilePaths = await this.hre.artifacts.getDebugFilePaths();
      const artifactPaths = await this.hre.artifacts.getArtifactPaths();
      assert.equal(debugFilePaths.length, artifactPaths.length);

      for (const debugFile of debugFilePaths) {
        const debug = require(debugFile);
        assert.equal(debug._format, "hh-sol-dbg-1");
        assert.exists(debug.buildInfo);
      }
    });

    it("Should return build info", async function () {
      const info = await this.hre.artifacts.getBuildInfo("Contract");
      assert.exists(info);
      const contract = info?.output.contracts["src/Contract.sol"].Contract!;
      assert.exists(contract);
      assert.exists(contract.abi);
      assert.exists((contract as any).devdoc);
      assert.exists((contract as any).metadata);
      assert.exists((contract as any).storageLayout);
      assert.exists((contract as any).userdoc);
      assert.exists(contract.evm);
      assert.exists(contract.evm.bytecode);
      assert.exists(contract.evm.bytecode.object);
      assert.exists(contract.evm.deployedBytecode);
      assert.exists(contract.evm.deployedBytecode.object);
    });

    it("Should forge build only if forgeOnly is true", async function () {
      this.hre.config.foundry = { forgeOnly: true };

      const artifactFolder = this.hre.config.paths.artifacts;
      await this.hre.run(TASK_CLEAN);
      expect(await fsExtra.pathExists(artifactFolder)).to.eq(false);

      await this.hre.run("compile");

      expect(await fsExtra.pathExists(artifactFolder)).to.eq(false);

      const config = await this.hre.run("forge:config");
      const forgedFiles = await getAllFiles(config.src);

      expect(forgedFiles.length).gt(0);
    });

    it("Should compile using both if forgeOnly is false", async function () {
      this.hre.config.foundry = { forgeOnly: false };

      const artifactFolder = this.hre.config.paths.artifacts;
      await this.hre.run(TASK_CLEAN);
      expect(await fsExtra.pathExists(artifactFolder)).to.eq(false);

      await this.hre.run("compile");

      expect(await fsExtra.pathExists(artifactFolder)).to.eq(true);

      const config = await this.hre.run("forge:config");
      const forgedFiles = await getAllFiles(config.src);
      const hhFiles = await getAllFiles(artifactFolder);

      expect(forgedFiles.length).gt(0);
      expect(hhFiles.length).gt(0);
    });

    it("Should vacuum low powa", async function () {
      this.hre.config.foundry = { cacheVacuum: 1, forgeOnly: true };
      await this.hre.run(TASK_CLEAN, { global: true });

      const artifactFolder = this.hre.config.paths.artifacts;
      await this.hre.run("compile");

      expect(await fsExtra.pathExists(artifactFolder)).to.eq(false);
      expect(await fsExtra.pathExists(this.hre.config.paths.cache)).to.eq(
        false
      );
    });

    it("Should vacuum high powa", async function () {
      this.hre.config.foundry = { cacheVacuum: 2, forgeOnly: true };
      const globalCache = await getCacheDir();
      await this.hre.run(TASK_CLEAN_GLOBAL, { global: true });

      const hhFiles = await getAllFiles(globalCache);
      expect(hhFiles.length).to.eq(0);
      await this.hre.run("compile");

      expect(await fsExtra.pathExists(globalCache)).to.eq(false);
    });
  });
});
